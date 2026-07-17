import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import type { JournalEntry, UserProfile, UserBadge } from '../types';

// ==========================================
// PINS (JOURNAL ENTRIES) SERVICES
// ==========================================

export const checkAndAwardBadges = async (entry: JournalEntry, userId: string): Promise<UserBadge[]> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return [];
  
  const userProfile = userSnap.data() as UserProfile;
  const currentBadges = userProfile.badges || [];
  const currentBadgeIds = currentBadges.map(b => b.id);
  
  const newBadges: UserBadge[] = [];

  // Check Explorer badge (first pin)
  if (!currentBadgeIds.includes('explorer')) {
    newBadges.push({ id: 'explorer', earnedAt: Date.now() });
  }

  // Check Category badge
  if (entry.category) {
    let categoryBadgeId = '';
    switch (entry.category) {
      case 'trek': categoryBadgeId = 'trekker'; break;
      case 'beach': categoryBadgeId = 'beach_bum'; break;
      case 'city': categoryBadgeId = 'city_slicker'; break;
      case 'nature': categoryBadgeId = 'nature_lover'; break;
      case 'food': categoryBadgeId = 'foodie'; break;
    }
    if (categoryBadgeId && !currentBadgeIds.includes(categoryBadgeId)) {
      newBadges.push({ id: categoryBadgeId, earnedAt: Date.now() });
    }
  }

  // Check Country badge
  if (entry.country) {
    const countryBadgeId = `country_${entry.country.replace(/\s+/g, '_')}`;
    if (!currentBadgeIds.includes(countryBadgeId)) {
      newBadges.push({ id: countryBadgeId, earnedAt: Date.now() });
    }
  }

  if (newBadges.length > 0) {
    await updateDoc(userRef, {
      badges: [...currentBadges, ...newBadges]
    });
    return newBadges;
  }
  return [];
};

export const savePin = async (entry: JournalEntry) => {
  const pinRef = doc(db, 'pins', entry.id);
  await setDoc(pinRef, entry, { merge: true });
  
  if (entry.authorId) {
    return await checkAndAwardBadges(entry, entry.authorId);
  }
  return [];
};

export const deletePin = async (pinId: string) => {
  await deleteDoc(doc(db, 'pins', pinId));
};

export const fetchPins = async (currentUid: string | undefined, showOnlyMine: boolean) => {
  const pinsRef = collection(db, 'pins');
  let q;

  if (showOnlyMine && currentUid) {
    // Show only the current user's pins
    q = query(pinsRef, where('authorId', '==', currentUid), orderBy('date', 'desc'), limit(100));
  } else {
    // Show public pins (we can optimize this later to show friends' pins)
    // For now, we fetch public pins. We will filter private/close friends on the client or via composite indexes
    q = query(pinsRef, where('visibility', 'in', ['public', 'close_friends']), orderBy('date', 'desc'), limit(100));
  }

  const snapshot = await getDocs(q);
  const pins: JournalEntry[] = [];
  snapshot.forEach(doc => {
    pins.push(doc.data() as JournalEntry);
  });
  return pins;
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
