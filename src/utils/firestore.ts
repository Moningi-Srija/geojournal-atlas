import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import type {
  JournalEntry,
  MemoryCollaborator,
  MemoryInvite,
  MemoryInviteDetails,
  UserProfile,
  UserBadge,
} from '../types';
import { BADGE_DEFINITIONS, getEarnedBadgeIds } from './badges';

// ==========================================
// PINS (JOURNAL ENTRIES) SERVICES
// ==========================================

export const recalculateUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return [];

  const userProfile = userSnap.data() as UserProfile;
  const currentBadges = userProfile.badges || [];
  const ownedPinsSnapshot = await getDocs(
    query(collection(db, 'pins'), where('authorId', '==', userId)),
  );
  const ownedEntries = ownedPinsSnapshot.docs.map((pin) => pin.data() as JournalEntry);
  const earnedIds = getEarnedBadgeIds(ownedEntries);
  const currentById = new Map(currentBadges.map((badge) => [badge.id, badge]));
  const managedIds = new Set(Object.keys(BADGE_DEFINITIONS));
  const legacyBadges = currentBadges.filter(
    (badge) => !managedIds.has(badge.id) && !badge.id.startsWith('country_'),
  );
  const now = Date.now();
  const calculatedBadges = earnedIds.map(
    (id): UserBadge => currentById.get(id) ?? { id, earnedAt: now },
  );
  const nextBadges = [...legacyBadges, ...calculatedBadges];
  const newlyAwarded = calculatedBadges.filter((badge) => !currentById.has(badge.id));

  await updateDoc(userRef, { badges: nextBadges });
  return newlyAwarded;
};

export const checkAndAwardBadges = async (
  _entry: JournalEntry,
  userId: string,
): Promise<UserBadge[]> => recalculateUserBadges(userId);

export interface ImportProgress {
  completed: number;
  total: number;
  percent: number;
}

const IMPORT_BATCH_SIZE = 200;
const ATLAS_QUERY_LIMIT = 100;

export const importPinsInBatches = async (
  entries: JournalEntry[],
  onProgress?: (progress: ImportProgress) => void,
) => {
  if (entries.length === 0) return 0;

  let completed = 0;
  onProgress?.({ completed, total: entries.length, percent: 0 });

  for (let offset = 0; offset < entries.length; offset += IMPORT_BATCH_SIZE) {
    const chunk = entries.slice(offset, offset + IMPORT_BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((entry) => {
      batch.set(doc(db, 'pins', entry.id), entry, { merge: true });
    });
    await batch.commit();
    completed += chunk.length;
    onProgress?.({
      completed,
      total: entries.length,
      percent: Math.round((completed / entries.length) * 100),
    });
  }

  const userId = entries[0]?.authorId;
  if (userId) {
    try {
      await recalculateUserBadges(userId);
    } catch (error) {
      console.warn('Pins imported, but badge progress could not be refreshed.', error);
    }
  }

  return completed;
};

export const savePin = async (entry: JournalEntry) => {
  const pinRef = doc(db, 'pins', entry.id);
  const previousPin = await getDoc(pinRef);
  const previousCollaborators = previousPin.exists()
    ? ((previousPin.data() as JournalEntry).collaborators || [])
    : [];
  const collaborators = entry.collaborators || [];
  const acceptedCollaboratorIds = collaborators
    .filter((collaborator) => collaborator.status === 'accepted')
    .map((collaborator) => collaborator.uid);
  const normalizedEntry: JournalEntry = {
    ...entry,
    collaborators,
    acceptedCollaboratorIds,
  };

  // The pin remains the only memory record. Invite documents are lightweight inbox
  // records, one per invitee, so accepting never duplicates a journal entry.
  const batch = writeBatch(db);
  batch.set(pinRef, normalizedEntry, { merge: true });

  const currentInviteeIds = new Set(collaborators.map((collaborator) => collaborator.uid));
  previousCollaborators.forEach((collaborator) => {
    if (!currentInviteeIds.has(collaborator.uid)) {
      batch.delete(doc(db, 'memoryInvites', `${entry.id}__${collaborator.uid}`));
    }
  });

  collaborators.forEach((collaborator) => {
    const invite: MemoryInvite = {
      id: `${entry.id}__${collaborator.uid}`,
      pinId: entry.id,
      inviterId: entry.authorId || '',
      inviteeId: collaborator.uid,
      status: collaborator.status,
      memoryTitle: entry.title,
      locationName: entry.locationName,
      invitedAt: collaborator.invitedAt,
      ...(collaborator.respondedAt ? { respondedAt: collaborator.respondedAt } : {}),
    };
    batch.set(doc(db, 'memoryInvites', invite.id), invite, { merge: true });
  });

  await batch.commit();

  if (entry.authorId) {
    return await checkAndAwardBadges(normalizedEntry, entry.authorId);
  }
  return [];
};

export const deletePin = async (pinId: string) => {
  await deleteDoc(doc(db, 'pins', pinId));
};

export const fetchPins = async (currentUid: string | undefined, showOnlyMine: boolean) => {
  const pinsRef = collection(db, 'pins');
  const queries = showOnlyMine && currentUid
    ? [
        query(pinsRef, where('authorId', '==', currentUid), orderBy('date', 'desc'), limit(ATLAS_QUERY_LIMIT)),
        query(pinsRef, where('acceptedCollaboratorIds', 'array-contains', currentUid), orderBy('date', 'desc'), limit(ATLAS_QUERY_LIMIT)),
      ]
    : [
        query(pinsRef, where('visibility', '==', 'public'), orderBy('date', 'desc'), limit(ATLAS_QUERY_LIMIT)),
        ...(currentUid
          ? [query(pinsRef, where('acceptedCollaboratorIds', 'array-contains', currentUid), orderBy('date', 'desc'), limit(ATLAS_QUERY_LIMIT))]
          : []),
      ];

  const snapshots = await Promise.all(queries.map((pinsQuery) => getDocs(pinsQuery)));
  const pinsById = new Map<string, JournalEntry>();
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((pinDoc) => {
      const pin = pinDoc.data() as JournalEntry;
      pinsById.set(pin.id || pinDoc.id, { ...pin, id: pin.id || pinDoc.id });
    });
  });

  return [...pinsById.values()].sort((a, b) => b.date - a.date).slice(0, 100);
};

export const fetchExplorerPins = async (explorerUid: string) => {
  const pinsRef = collection(db, 'pins');
  // Filter by explorer on the server. The old implementation downloaded every
  // public pin in the project before filtering in the browser.
  const snapshots = await Promise.all([
    getDocs(query(
      pinsRef,
      where('authorId', '==', explorerUid),
      where('visibility', '==', 'public'),
      orderBy('date', 'desc'),
      limit(ATLAS_QUERY_LIMIT),
    )),
    getDocs(query(
      pinsRef,
      where('acceptedCollaboratorIds', 'array-contains', explorerUid),
      where('visibility', '==', 'public'),
      orderBy('date', 'desc'),
      limit(ATLAS_QUERY_LIMIT),
    )),
  ]);
  const pinsById = new Map<string, JournalEntry>();
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((pinDoc) => {
      const pin = pinDoc.data() as JournalEntry;
      pinsById.set(pin.id || pinDoc.id, { ...pin, id: pin.id || pinDoc.id });
    });
  });

  return [...pinsById.values()]
    .sort((a, b) => b.date - a.date)
    .slice(0, ATLAS_QUERY_LIMIT);
};

// ==========================================
// SHARED MEMORY INVITES
// ==========================================

export const getMemoryInvites = async (currentUid: string): Promise<MemoryInviteDetails[]> => {
  const snapshot = await getDocs(
    query(collection(db, 'memoryInvites'), where('inviteeId', '==', currentUid)),
  );
  const invites = snapshot.docs.map((inviteDoc) => ({
    ...(inviteDoc.data() as MemoryInvite),
    id: inviteDoc.id,
  }));
  const inviterIds = [...new Set(invites.map((invite) => invite.inviterId).filter(Boolean))];
  const inviterSnapshots = await Promise.all(
    inviterIds.map((inviterId) => getDoc(doc(db, 'users', inviterId))),
  );
  const inviters = new Map<string, UserProfile>();
  inviterSnapshots.forEach((inviterSnapshot) => {
    if (inviterSnapshot.exists()) {
      const profile = inviterSnapshot.data() as UserProfile;
      inviters.set(profile.uid || inviterSnapshot.id, profile);
    }
  });

  return invites
    .map((invite) => ({ ...invite, inviter: inviters.get(invite.inviterId) }))
    .sort((a, b) => b.invitedAt - a.invitedAt);
};

export const respondToMemoryInvite = async (
  currentUid: string,
  inviteId: string,
  response: 'accepted' | 'declined',
) => {
  const respondedAt = Date.now();

  await runTransaction(db, async (transaction) => {
    const inviteRef = doc(db, 'memoryInvites', inviteId);
    const inviteSnapshot = await transaction.get(inviteRef);
    if (!inviteSnapshot.exists()) {
      throw new Error('This shared-trip invitation no longer exists.');
    }

    const invite = inviteSnapshot.data() as MemoryInvite;
    if (invite.inviteeId !== currentUid) {
      throw new Error('This shared-trip invitation belongs to another explorer.');
    }

    const pinRef = doc(db, 'pins', invite.pinId);
    const pinSnapshot = await transaction.get(pinRef);
    if (!pinSnapshot.exists()) {
      throw new Error('The memory linked to this invitation is no longer available.');
    }

    const pin = pinSnapshot.data() as JournalEntry;
    const collaborators = (pin.collaborators || []).map(
      (collaborator): MemoryCollaborator => collaborator.uid === currentUid
        ? { ...collaborator, status: response, respondedAt }
        : collaborator,
    );
    if (!collaborators.some((collaborator) => collaborator.uid === currentUid)) {
      throw new Error('You are no longer listed as a co-traveler on this memory.');
    }

    transaction.update(pinRef, {
      collaborators,
      acceptedCollaboratorIds: collaborators
        .filter((collaborator) => collaborator.status === 'accepted')
        .map((collaborator) => collaborator.uid),
    });
    transaction.update(inviteRef, { status: response, respondedAt });
  });
};

// ==========================================
// SOCIAL SERVICES
// ==========================================

export const sendFollowRequest = async (currentUid: string, targetUid: string) => {
  // Check if target user is private
  const targetUserSnap = await getDoc(doc(db, 'users', targetUid));
  const isPrivate = targetUserSnap.exists() ? targetUserSnap.data().isPrivate : true;

  const status = isPrivate ? 'requested' : 'following';

  // Create relationship document in current user's following subcollection
  await setDoc(doc(db, `users/${currentUid}/following`, targetUid), {
    status,
    timestamp: serverTimestamp(),
    isCloseFriend: false
  });

  // Create reverse relationship in target user's followers subcollection
  await setDoc(doc(db, `users/${targetUid}/followers`, currentUid), {
    status,
    timestamp: serverTimestamp()
  });

  if (!isPrivate) {
    // Increment counts if auto-accepted
    // Note: In production, use Firebase Cloud Functions or Transactions for atomic counters
  }
};

export const acceptFollowRequest = async (currentUid: string, followerUid: string) => {
  // Update both sides to 'following'
  await updateDoc(doc(db, `users/${followerUid}/following`, currentUid), { status: 'following' });
  await updateDoc(doc(db, `users/${currentUid}/followers`, followerUid), { status: 'following' });
};

export const searchUsers = async (searchTerm: string) => {
  if (!searchTerm) return [];
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchTerm.toLowerCase()),
    where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
    limit(10)
  );

  const snapshot = await getDocs(q);
  const users: UserProfile[] = [];
  snapshot.forEach(doc => {
    users.push(doc.data() as UserProfile);
  });
  return users;
};

export const toggleCloseFriend = async (currentUid: string, followingUid: string, isCloseFriend: boolean) => {
  await updateDoc(doc(db, `users/${currentUid}/following`, followingUid), {
    isCloseFriend
  });
};

export const getFollowing = async (currentUid: string) => {
  const followingRef = collection(db, `users/${currentUid}/following`);
  const snapshot = await getDocs(followingRef);

  const followingList: any[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const userProfileSnap = await getDoc(doc(db, 'users', docSnap.id));
    if (userProfileSnap.exists()) {
      followingList.push({ ...userProfileSnap.data(), relationship: data });
    }
  }
  return followingList;
};

export const getFollowers = async (currentUid: string) => {
  const followersRef = collection(db, `users/${currentUid}/followers`);
  const snapshot = await getDocs(followersRef);

  const followersList: any[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const userProfileSnap = await getDoc(doc(db, 'users', docSnap.id));
    if (userProfileSnap.exists()) {
      followersList.push({ ...userProfileSnap.data(), relationship: data });
    }
  }
  return followersList;
};
