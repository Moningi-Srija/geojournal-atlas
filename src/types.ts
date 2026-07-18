export type EntryCategory = 'trek' | 'beach' | 'city' | 'nature' | 'food' | 'culture' | 'general';

export type CollaborationStatus = 'pending' | 'accepted' | 'declined';

export interface MemoryCollaborator {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  status: CollaborationStatus;
  invitedAt: number;
  respondedAt?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  photos: string[]; // Image sources (Base64 data URLs or remote preview URLs)
  googlePhotosUrl?: string; // Optional Google Photos album link
  locationName: string;
  lat: number;
  lng: number;
  date: number; // timestamp in milliseconds
  authorId?: string; // The user ID of the creator
  visibility?: 'public' | 'private' | 'close_friends'; // Defaults to private
  category?: EntryCategory;
  country?: string; // ISO Code or Name
  importSource?: 'google-timeline' | 'instagram';
  importedAt?: number;
  sourceUrl?: string;
  collaborators?: MemoryCollaborator[];
  /** Denormalized IDs make accepted shared memories queryable without duplicating pins. */
  acceptedCollaboratorIds?: string[];
}

export interface UserBadge {
  id: string; // The ID of the badge (e.g., 'trekker', 'country_FR')
  earnedAt: number; // timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  bio: string;
  isPrivate: boolean; // if true, follow requests must be approved
  followersCount: number;
  followingCount: number;
  createdAt: number;
  badges?: UserBadge[];
  onboardingCompleted?: boolean;
}

export interface MemoryInvite {
  id: string;
  pinId: string;
  inviterId: string;
  inviteeId: string;
  status: CollaborationStatus;
  memoryTitle: string;
  locationName: string;
  invitedAt: number;
  respondedAt?: number;
}

export interface MemoryInviteDetails extends MemoryInvite {
  inviter?: UserProfile;
}
