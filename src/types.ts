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
}
