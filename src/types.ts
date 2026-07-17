export type EntryCategory = 'trek' | 'beach' | 'city' | 'nature' | 'food' | 'culture' | 'general';

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  photos: string[]; // Array of Base64 data URL strings
  googlePhotosUrl?: string; // Optional Google Photos album link
  locationName: string;
  lat: number;
  lng: number;
  date: number; // timestamp in milliseconds
  authorId?: string; // The user ID of the creator
  visibility?: 'public' | 'private' | 'close_friends'; // Defaults to private
  category?: EntryCategory;
  country?: string; // ISO Code or Name
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
}
