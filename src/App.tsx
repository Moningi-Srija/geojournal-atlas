import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Compass, User as UserIcon, LogOut, Users, List, MapPin, Sparkles, Globe2, Map as MapIcon, Lightbulb, BookOpen } from 'lucide-react';
import type { JournalEntry, UserProfile } from './types';
import { GlobeView } from './components/GlobeView';
import { LeafletMap } from './components/LeafletMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { CreateEntryPanel } from './components/CreateEntryPanel';
import { EntryCard } from './components/EntryCard';
import { AuthModal } from './components/AuthModal';
import { SocialPanel } from './components/SocialPanel';
import { LandingPage } from './components/LandingPage';
import { ProfilePanel } from './components/ProfilePanel';
import { ImportDataModal } from './components/ImportDataModal';
import { AICopilotPanel } from './components/AICopilotPanel';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AISearchBar } from './components/AISearchBar';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { InspirationPanel } from './components/InspirationPanel';
import { ExplorerAtlasPanel } from './components/ExplorerAtlasPanel';
import { DemoTour } from './components/DemoTour';
import { useAuth } from './components/AuthContext';
import { fetchPins, savePin, deletePin as deletePinFirestore } from './utils/firestore';
import { getCountryBadgeMilestones } from './utils/badges';

const demoYearsAgo = (years: number, dayOffset = 0) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() + dayOffset);
  return date.getTime();
};

const DEMO_PROFILE: UserProfile = {
  uid: 'demo-srija',
  email: 'demo@geojournal.local',
  displayName: 'Srija',
  username: 'srijaexplores',
  photoURL: '/srija-demo-profile.png',
  bio: 'Collecting places that feel like stories.',
  isPrivate: false,
  followersCount: 248,
  followingCount: 176,
  createdAt: Date.now(),
  onboardingCompleted: true,
  badges: [{ id: 'explorer', earnedAt: Date.now() }],
};

const DEMO_EXPLORERS: UserProfile[] = [
  {
    uid: 'demo-ananya',
    email: 'ananya@geojournal.local',
    displayName: 'Ananya Kapoor',
    username: 'weekendwayfinder',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya',
    bio: 'Chasing monsoons, ruins and excellent roadside chai.',
    isPrivate: false,
    followersCount: 613,
    followingCount: 204,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
  {
    uid: 'demo-noah',
    email: 'noah@geojournal.local',
    displayName: 'Noah Williams',
    username: 'slowroads',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Noah',
    bio: 'Food markets, long train rides and cities at blue hour.',
    isPrivate: false,
    followersCount: 421,
    followingCount: 189,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
  {
    uid: 'demo-maya',
    email: 'maya@geojournal.local',
    displayName: 'Maya Chen',
    username: 'mountainstamped',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya',
    bio: 'Mountain weather, tiny cabins and trails worth waking up early for.',
    isPrivate: false,
    followersCount: 892,
    followingCount: 318,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
  {
    uid: 'demo-mateo',
    email: 'mateo@geojournal.local',
    displayName: 'Mateo Silva',
    username: 'coastandcoffee',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mateo',
    bio: 'Coastal towns, local coffee and long walks with no itinerary.',
    isPrivate: false,
    followersCount: 734,
    followingCount: 265,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
  {
    uid: 'demo-amina',
    email: 'amina@geojournal.local',
    displayName: 'Amina Okafor',
    username: 'passportandplates',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amina',
    bio: 'Remembering cities through markets, recipes and conversations.',
    isPrivate: false,
    followersCount: 1250,
    followingCount: 407,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
  {
    uid: 'demo-lena',
    email: 'lena@geojournal.local',
    displayName: 'Lena Fischer',
    username: 'nighttrainnotes',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lena',
    bio: 'Slow rail journeys, alpine mornings and handwritten station notes.',
    isPrivate: true,
    followersCount: 506,
    followingCount: 144,
    createdAt: Date.now(),
    onboardingCompleted: true,
  },
];

const DEMO_PROFILES_BY_ID = Object.fromEntries(
  [DEMO_PROFILE, ...DEMO_EXPLORERS].map((explorer) => [explorer.uid, explorer]),
) as Record<string, UserProfile>;

const DEMO_FRIEND_ENTRIES: JournalEntry[] = [
  {
    id: 'demo-ananya-hampi',
    authorId: 'demo-ananya',
    title: 'Sunrise over Hampi',
    body: 'Climbed before dawn and watched the first light move across boulders, temple towers and banana fields.',
    photos: ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Hampi, Karnataka',
    lat: 15.335,
    lng: 76.46,
    country: 'India',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 18 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-ananya-goa',
    authorId: 'demo-ananya',
    title: 'A quiet corner of South Goa',
    body: 'A slow afternoon of salt air, a nearly empty beach and a tiny cafe worth returning to.',
    photos: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Palolem, Goa',
    lat: 15.0099,
    lng: 74.0232,
    country: 'India',
    category: 'beach',
    visibility: 'public',
    date: Date.now() - 72 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-ananya-varanasi',
    authorId: 'demo-ananya',
    title: 'First light on the Ganges',
    body: 'A quiet boat before sunrise, temple bells across the water and a city slowly waking around the ghats.',
    photos: ['https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Varanasi, Uttar Pradesh',
    lat: 25.3176,
    lng: 82.9739,
    country: 'India',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 102 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-ananya-jaipur',
    authorId: 'demo-ananya',
    title: 'Blue hour above the Pink City',
    body: 'Rooftops, old observatories and the warm sandstone of Jaipur turning violet after sunset.',
    photos: ['https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Jaipur, Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    country: 'India',
    category: 'city',
    visibility: 'public',
    date: Date.now() - 132 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-noah-lisbon',
    authorId: 'demo-noah',
    title: 'Lisbon after the last tram',
    body: 'Blue-hour streets, grilled sardines and the sound of music escaping from a tiny doorway in Alfama.',
    photos: ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Lisbon, Portugal',
    lat: 38.7223,
    lng: -9.1393,
    country: 'Portugal',
    category: 'city',
    visibility: 'public',
    date: Date.now() - 33 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-noah-marrakech',
    authorId: 'demo-noah',
    title: 'Spice market at golden hour',
    body: 'A maze of colour, mint tea and a vendor who explained every spice like it was part of his family history.',
    photos: ['https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Marrakech, Morocco',
    lat: 31.6295,
    lng: -7.9811,
    country: 'Morocco',
    category: 'food',
    visibility: 'public',
    date: Date.now() - 111 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-maya-lofoten',
    authorId: 'demo-maya',
    title: 'Midnight sun in Lofoten',
    body: 'A trail above the fishing villages where the evening simply refused to become night.',
    photos: ['https://images.unsplash.com/photo-1520769669658-f07657f5a307?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Lofoten, Norway',
    lat: 68.2088,
    lng: 13.9156,
    country: 'Norway',
    category: 'nature',
    visibility: 'public',
    date: Date.now() - 48 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-mateo-cartagena',
    authorId: 'demo-mateo',
    title: 'Cartagena in colour',
    body: 'Balconies covered in flowers, strong coffee and a sunset walk along the old city walls.',
    photos: ['https://images.unsplash.com/photo-1533699224246-6dc3b3ed3304?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Cartagena, Colombia',
    lat: 10.391,
    lng: -75.4794,
    country: 'Colombia',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 64 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-amina-zanzibar',
    authorId: 'demo-amina',
    title: 'Stone Town supper trail',
    body: 'Shared coconut bread, grilled seafood and stories with three generations of one family.',
    photos: ['https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Stone Town, Zanzibar',
    lat: -6.1659,
    lng: 39.2026,
    country: 'Tanzania',
    category: 'food',
    visibility: 'public',
    date: Date.now() - 96 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-lena-alps',
    authorId: 'demo-lena',
    title: 'First train into the Alps',
    body: 'Frosted windows, a quiet platform and the first glimpse of the peaks catching morning light.',
    photos: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Bernese Oberland, Switzerland',
    lat: 46.5937,
    lng: 7.9075,
    country: 'Switzerland',
    category: 'trek',
    visibility: 'public',
    date: Date.now() - 126 * 24 * 60 * 60 * 1000,
  },
];

const DEMO_SHARED_INVITE_ENTRY: JournalEntry = {
  id: 'demo-coorg-shared',
  authorId: 'demo-ananya',
  title: 'Monsoon trails in Coorg',
  body: 'Ananya tagged Srija after a misty forest walk, strong filter coffee and a spectacular wrong turn.',
  photos: ['https://images.unsplash.com/photo-1593693411515-c20261bcad6e?q=80&w=900&auto=format&fit=crop'],
  locationName: 'Madikeri, Karnataka',
  lat: 12.4244,
  lng: 75.7382,
  country: 'India',
  category: 'trek',
  visibility: 'private',
  date: Date.now() - 21 * 24 * 60 * 60 * 1000,
  collaborators: [{
    uid: DEMO_PROFILE.uid,
    username: DEMO_PROFILE.username,
    displayName: DEMO_PROFILE.displayName,
    photoURL: DEMO_PROFILE.photoURL,
    status: 'accepted',
    invitedAt: Date.now() - 42 * 60 * 1000,
    respondedAt: Date.now(),
  }],
  acceptedCollaboratorIds: [DEMO_PROFILE.uid],
};

const DEMO_LISBON_SHARED_ENTRY: JournalEntry = {
  id: 'demo-lisbon-shared',
  authorId: 'demo-noah',
  title: 'Lisbon night-train reunion',
  body: 'Noah tagged Srija in a shared memory from the night the group reunited in Lisbon after three years.',
  photos: ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=900&auto=format&fit=crop'],
  locationName: 'Lisbon, Portugal',
  lat: 38.7223,
  lng: -9.1393,
  country: 'Portugal',
  category: 'city',
  visibility: 'private',
  date: Date.now() - 52 * 24 * 60 * 60 * 1000,
  collaborators: [{
    uid: DEMO_PROFILE.uid,
    username: DEMO_PROFILE.username,
    displayName: DEMO_PROFILE.displayName,
    photoURL: DEMO_PROFILE.photoURL,
    status: 'accepted',
    invitedAt: Date.now() - 52 * 24 * 60 * 60 * 1000,
    respondedAt: Date.now() - 51 * 24 * 60 * 60 * 1000,
  }],
  acceptedCollaboratorIds: [DEMO_PROFILE.uid],
};

const DEMO_MEGHALAYA_SHARED_ENTRY: JournalEntry = {
  id: 'demo-meghalaya-shared',
  authorId: 'demo-maya',
  title: 'Cloud roads in Meghalaya',
  body: 'Maya invited Srija to remember a road trip through living root bridges, rain and endless green valleys.',
  photos: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=900&auto=format&fit=crop'],
  locationName: 'Cherrapunji, Meghalaya',
  lat: 25.2702,
  lng: 91.732,
  country: 'India',
  category: 'nature',
  visibility: 'private',
  date: Date.now() - 12 * 24 * 60 * 60 * 1000,
  collaborators: [{
    uid: DEMO_PROFILE.uid,
    username: DEMO_PROFILE.username,
    displayName: DEMO_PROFILE.displayName,
    photoURL: DEMO_PROFILE.photoURL,
    status: 'accepted',
    invitedAt: Date.now() - 3 * 60 * 60 * 1000,
    respondedAt: Date.now(),
  }],
  acceptedCollaboratorIds: [DEMO_PROFILE.uid],
};

const DEMO_SHARED_ENTRIES = [
  DEMO_SHARED_INVITE_ENTRY,
  DEMO_LISBON_SHARED_ENTRY,
  DEMO_MEGHALAYA_SHARED_ENTRY,
];

// Default public entries keep Explore and the anniversary demo visually alive.
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'kyoto-1',
    authorId: DEMO_PROFILE.uid,
    title: 'Autumn in Kyoto',
    body: 'Walking through the historic streets of Gion. The maple leaves have turned a brilliant shade of crimson, contrasting beautifully with the dark wood of the traditional machiya townhouses.',
    photos: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'Kyoto, Japan',
    lat: 35.0116,
    lng: 135.7681,
    country: 'Japan',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
  {
    id: 'paris-1',
    authorId: DEMO_PROFILE.uid,
    title: 'Seine River Cruise',
    body: 'Watched the sunset behind the Eiffel Tower from the deck of a boat on the Seine. The Eiffel Tower began its sparkling light show just as the stars started appearing in the night sky.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499856871958-5b9647a64db0?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509067186863-8e4ad9e289bf?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'Paris, France',
    lat: 48.8566,
    lng: 2.3522,
    country: 'France',
    category: 'city',
    visibility: 'public',
    date: demoYearsAgo(2, -5), // Same month in an earlier year for Rediscover
  },
  {
    id: 'nyc-1',
    authorId: DEMO_PROFILE.uid,
    title: 'Manhattan Skyline View',
    body: 'Looked out over the city from DUMBO in Brooklyn. The Brooklyn Bridge framed the skyscrapers of Lower Manhattan perfectly as the evening lights flickered on.',
    photos: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'New York, USA',
    lat: 40.7128,
    lng: -74.0060,
    country: 'United States',
    category: 'city',
    visibility: 'public',
    date: demoYearsAgo(1), // On this day in an earlier year
  }
];

const DEMO_EXTRA_OWN_ENTRIES: JournalEntry[] = [
  {
    id: 'demo-srija-munnar',
    authorId: DEMO_PROFILE.uid,
    title: 'Monsoon morning in Munnar',
    body: 'Tea gardens disappearing into mist, rain on the cottage roof and a road that looked painted in green.',
    photos: ['https://images.unsplash.com/photo-1593693411515-c20261bcad6e?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Munnar, Kerala',
    lat: 10.0889,
    lng: 77.0595,
    country: 'India',
    category: 'nature',
    visibility: 'private',
    date: Date.now() - 16 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-ladakh',
    authorId: DEMO_PROFILE.uid,
    title: 'Road above the clouds',
    body: 'A cold ride through Ladakh where every turn revealed another impossible landscape.',
    photos: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Leh, Ladakh',
    lat: 34.1526,
    lng: 77.5771,
    country: 'India',
    category: 'trek',
    visibility: 'public',
    date: Date.now() - 84 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-bengaluru',
    authorId: DEMO_PROFILE.uid,
    title: 'Filter coffee and first ideas',
    body: 'A tiny Bengaluru cafe, a strong filter coffee and the notebook page where GeoJournal first started taking shape.',
    photos: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Bengaluru, Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    country: 'India',
    category: 'food',
    visibility: 'private',
    date: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-udaipur',
    authorId: DEMO_PROFILE.uid,
    title: 'Lake light in Udaipur',
    body: 'A slow evening beside Lake Pichola, white palaces reflecting gold and a rooftop dinner that lasted for hours.',
    photos: ['https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Udaipur, Rajasthan',
    lat: 24.5854,
    lng: 73.7125,
    country: 'India',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 38 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-cappadocia',
    authorId: DEMO_PROFILE.uid,
    title: 'Balloons before breakfast',
    body: 'Woke before sunrise to watch the Cappadocia valleys slowly fill with colour and hot-air balloons.',
    photos: ['https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Cappadocia, Türkiye',
    lat: 38.6431,
    lng: 34.8289,
    country: 'Türkiye',
    category: 'nature',
    visibility: 'public',
    date: Date.now() - 145 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-singapore',
    authorId: DEMO_PROFILE.uid,
    title: 'Harbour lights and hawker stories',
    body: 'An evening walking from the hawker centre to the bay, collecting recommendations from everyone I met.',
    photos: ['https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    country: 'Singapore',
    category: 'city',
    visibility: 'public',
    date: Date.now() - 202 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-kudremukh',
    authorId: DEMO_PROFILE.uid,
    title: 'Mist on the Kudremukh trail',
    body: 'A steep forest hike through monsoon grasslands, waterfalls and ridgelines that vanished into cloud.',
    photos: ['https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Kudremukh, Karnataka',
    lat: 13.1309,
    lng: 75.2738,
    country: 'India',
    category: 'trek',
    visibility: 'public',
    date: Date.now() - 221 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-valley-flowers',
    authorId: DEMO_PROFILE.uid,
    title: 'Trail into the Valley of Flowers',
    body: 'A long mountain hike through the national park, with wildflowers, rain and one unforgettable summit view.',
    photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Valley of Flowers, Uttarakhand',
    lat: 30.728,
    lng: 79.6053,
    country: 'India',
    category: 'trek',
    visibility: 'public',
    date: Date.now() - 246 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-thekkady',
    authorId: DEMO_PROFILE.uid,
    title: 'Wild morning in Thekkady',
    body: 'Forest paths, a still lake and an early wildlife walk before the park became busy.',
    photos: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Thekkady, Kerala',
    lat: 9.6031,
    lng: 77.1615,
    country: 'India',
    category: 'nature',
    visibility: 'private',
    date: Date.now() - 269 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-varkala',
    authorId: DEMO_PROFILE.uid,
    title: 'Cliff cafe above Varkala beach',
    body: 'A quiet beach morning followed by strong coffee, a tiny cafe lunch and sunset from the red cliffs.',
    photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Varkala, Kerala',
    lat: 8.7379,
    lng: 76.7163,
    country: 'India',
    category: 'beach',
    visibility: 'public',
    date: Date.now() - 294 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-gokarna',
    authorId: DEMO_PROFILE.uid,
    title: 'Seafood supper after Gokarna',
    body: 'Walked the coastal trail between beaches, then found a family restaurant for a long seafood dinner.',
    photos: ['https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Gokarna, Karnataka',
    lat: 14.5479,
    lng: 74.3188,
    country: 'India',
    category: 'beach',
    visibility: 'public',
    date: Date.now() - 318 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-havelock',
    authorId: DEMO_PROFILE.uid,
    title: 'Blue water at Havelock',
    body: 'A bright shore, a slow snorkel and a beach lunch cooked from the morning catch.',
    photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Havelock Island, Andaman',
    lat: 12.0083,
    lng: 93.0089,
    country: 'India',
    category: 'beach',
    visibility: 'public',
    date: Date.now() - 341 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-srija-hampi',
    authorId: DEMO_PROFILE.uid,
    title: 'Stories carved into Hampi',
    body: 'A heritage walk through temple courtyards, stone chariots and historic ruins glowing before sunset.',
    photos: ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=900&auto=format&fit=crop'],
    locationName: 'Hampi, Karnataka',
    lat: 15.335,
    lng: 76.46,
    country: 'India',
    category: 'culture',
    visibility: 'public',
    date: Date.now() - 366 * 24 * 60 * 60 * 1000,
  },
];

function App() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  const { user, profile, loading, logout, updateProfile } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(() => (
    sessionStorage.getItem('geojournal_demo_mode') === 'true'
    || new URLSearchParams(window.location.search).get('demo') === '1'
  ));
  const visibleProfile = isDemoMode ? DEMO_PROFILE : profile;
  const hasAtlasAccess = Boolean(user || isDemoMode);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [explorerProfile, setExplorerProfile] = useState<UserProfile | null>(null);
  const [aiSearchFilter, setAiSearchFilter] = useState<string[] | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [pinsRefreshKey, setPinsRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'globe' | 'map'>(() => {
    return (localStorage.getItem('geojournal_viewMode') as 'globe' | 'map') || 'globe';
  });

  const personalAtlasEntries = useMemo(() => {
    if (!visibleProfile) return [];
    return entries.filter((entry) => (
      entry.authorId === visibleProfile.uid
      || entry.acceptedCollaboratorIds?.includes(visibleProfile.uid)
    ));
  }, [entries, visibleProfile]);

  const atlasEntries = useMemo(() => {
    if (!isDemoMode) return entries;
    if (showOnlyMine) return personalAtlasEntries;

    return Array.from(
      new Map([...personalAtlasEntries, ...DEMO_FRIEND_ENTRIES].map((entry) => [entry.id, entry])).values(),
    );
  }, [entries, isDemoMode, showOnlyMine, personalAtlasEntries]);

  const profileCountryBadges = useMemo(
    () => getCountryBadgeMilestones(personalAtlasEntries),
    [personalAtlasEntries],
  );
  const friendPinCount = isDemoMode ? Math.max(0, atlasEntries.length - personalAtlasEntries.length) : 0;

  useEffect(() => {
    localStorage.setItem('geojournal_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isDemoMode) sessionStorage.setItem('geojournal_demo_mode', 'true');
  }, [isDemoMode]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('geojournal_atlas_theme');
    document.documentElement.dataset.atlasTheme = ['midnight', 'aurora', 'ember'].includes(storedTheme || '')
      ? storedTheme || 'midnight'
      : 'midnight';
  }, []);

  // Fetch entries from Firestore
  useEffect(() => {
    let cancelled = false;

    const loadPins = async () => {
      if (isDemoMode) {
        setEntries((current) => current.some((entry) => entry.authorId === DEMO_PROFILE.uid)
          ? current
          : [...INITIAL_ENTRIES, ...DEMO_EXTRA_OWN_ENTRIES, DEMO_LISBON_SHARED_ENTRY]);
        return;
      }
      try {
        const cloudPins = await fetchPins(user?.uid, showOnlyMine);
        if (cancelled) return;

        // Keep the public Explore experience visually alive for a brand-new
        // account or a presentation environment with no published memories yet.
        // My Pins intentionally stays empty so the cold-start import flow is real.
        if (!showOnlyMine && cloudPins.length === 0) {
          setEntries(INITIAL_ENTRIES);
        } else {
          setEntries(cloudPins);
        }
      } catch (err) {
        console.error('Failed to load pins from cloud:', err);
      }
    };
    loadPins();

    return () => {
      cancelled = true;
    };
  }, [user, showOnlyMine, pinsRefreshKey, isDemoMode]);

  const refreshPins = () => {
    setPinsRefreshKey((current) => current + 1);
  };

  const handleSaveEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number }) => {
    if (!user && !isDemoMode) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in before saving a memory.');
    }

    // Firestore rejects undefined field values by default. Keep optional fields
    // truly optional instead of passing them through as `undefined`.
    const cleanEntryData = Object.fromEntries(
      Object.entries(newEntryData).filter(([, value]) => value !== undefined)
    ) as typeof newEntryData;

    const entryDataWithAuthor = {
      ...cleanEntryData,
      authorId: isDemoMode ? DEMO_PROFILE.uid : user!.uid,
    };

    let savedEntry: JournalEntry;

    if (entryDataWithAuthor.id) {
      // Editing existing entry
      savedEntry = {
        ...entryDataWithAuthor,
        id: entryDataWithAuthor.id,
        date: entryDataWithAuthor.date || Date.now(),
      } as JournalEntry;
    } else {
      // Creating new entry
      savedEntry = {
        ...entryDataWithAuthor,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        date: Date.now(),
      } as JournalEntry;
    }

    if (isDemoMode) {
      setEntries((prev) => {
        const exists = prev.some((entry) => entry.id === savedEntry.id);
        return exists
          ? prev.map((entry) => entry.id === savedEntry.id ? savedEntry : entry)
          : [savedEntry, ...prev];
      });
      setSelectedEntry(savedEntry);
      setShowOnlyMine(true);
      return;
    }

    try {
      const newlyAwardedBadges = await savePin(savedEntry);
      
      // Update local UI state
      setEntries((prev) => {
        const exists = prev.find((e) => e.id === savedEntry.id);
        if (exists) {
          return prev.map((e) => (e.id === savedEntry.id ? savedEntry : e));
        }
        return [savedEntry, ...prev];
      });
      setSelectedEntry(savedEntry);
      // New memories default to private, so keep the presenter/user in the
      // collection where the freshly saved pin remains visible after reload.
      setShowOnlyMine(true);

      if (profile && newlyAwardedBadges.length > 0) {
        const mergedBadges = [...(profile.badges || []), ...newlyAwardedBadges].filter(
          (badge, index, badges) => badges.findIndex((candidate) => candidate.id === badge.id) === index
        );

        try {
          await updateProfile({ badges: mergedBadges });
        } catch (profileError) {
          // The memory itself is already safely stored; a profile refresh should
          // not turn a successful save into a duplicate-producing retry.
          console.error('Memory saved, but badge display could not be refreshed:', profileError);
        }
      }
    } catch (err) {
      console.error('Failed to save pin to cloud:', err);
      throw new Error('Could not save this memory. Please check your connection and try again.');
    }
  };

  const handleCloseCreatePanel = () => {
    setIsCreateOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: string) => {
    if (isDemoMode && selectedEntry?.id === id && selectedEntry.authorId === DEMO_PROFILE.uid) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setSelectedEntry(null);
      return;
    }
    if (!user || selectedEntry?.id !== id || selectedEntry.authorId !== user.uid) return;
    try {
      await deletePinFirestore(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to delete from cloud:', err);
    }
  };

  const handleSelectEntry = (entry: JournalEntry | null) => {
    setIsAICopilotOpen(false);
    setIsSocialOpen(false);
    setSelectedEntry(entry);
  };

  const openNexus = () => {
    setIsSidebarOpen(false);
    setSelectedEntry(null);
    setIsSocialOpen(false);
    setIsProfileOpen(false);
    setIsAICopilotOpen(true);
  };

  const openSocial = () => {
    setIsSidebarOpen(false);
    setSelectedEntry(null);
    setIsAICopilotOpen(false);
    setIsProfileOpen(false);
    setIsSocialOpen(true);
  };

  const openInspiration = () => {
    setIsSidebarOpen(false);
    setSelectedEntry(null);
    setIsAICopilotOpen(false);
    setIsSocialOpen(false);
    setIsProfileOpen(false);
    setIsInspirationOpen(true);
  };

  const openProfile = () => {
    setIsSidebarOpen(false);
    setSelectedEntry(null);
    setIsAICopilotOpen(false);
    setIsSocialOpen(false);
    setIsProfileOpen(true);
  };

  const openCreate = () => {
    if (!user && !isDemoMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setSelectedEntry(null);
    setIsAICopilotOpen(false);
    setIsSocialOpen(false);
    setEditingEntry(null);
    setIsCreateOpen(true);
  };

  const prepareDemoTourStep = useCallback((stepIndex: number) => {
    setSelectedEntry(null);
    setIsSocialOpen(false);
    setIsProfileOpen(false);
    setIsAICopilotOpen(false);
    setIsInspirationOpen(false);
    setExplorerProfile(null);

    // The final two journal steps point to controls inside the open drawer.
    if (stepIndex === 3 || stepIndex === 4) setIsSidebarOpen(true);
  }, []);

  const enterDemoAtlas = () => {
    sessionStorage.setItem('geojournal_demo_mode', 'true');
    setIsDemoMode(true);
    setShowOnlyMine(false);
    setIsSidebarOpen(true);
  };

  const exitAtlas = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem('geojournal_demo_mode');
      setIsDemoMode(false);
      setEntries([]);
      setSelectedEntry(null);
      return;
    }
    await logout();
  };

  if (loading) {
    return (
      <div className="app-loading-state">
        <div className="app-loading-orbit" aria-hidden="true">
          <div className="app-loading-globe"><Compass size={30} /></div>
          <i />
        </div>
        <h2>Opening your Atlas</h2>
        <p>Bringing your places and stories into view…</p>
      </div>
    );
  }

  return (
    <div className="atlas-app-shell relative w-full h-full">
      
      {/* 1. Header Navigation Bar */}
      {hasAtlasAccess && (
        <header className="app-topbar">
          <div className="app-brand" aria-label="GeoJournal 3D Memory Atlas">
            <span className="app-brand-mark"><Compass size={21} /></span>
            <span className="app-brand-copy">
              <strong>GeoJournal</strong>
              <small><i /> Memory Atlas</small>
            </span>
            {isDemoMode && <span className="demo-mode-chip">Demo</span>}
          </div>

          <div className="app-search-zone" data-tour="semantic-search">
            <AISearchBar entries={atlasEntries} onSearchComplete={setAiSearchFilter} />
          </div>

          <div className="app-topbar-actions">
            <nav className="app-scope-switcher" aria-label="Memory scope" data-tour="scope-switcher">
              <button
                type="button"
                onClick={() => {
                  setShowOnlyMine(false);
                  setSelectedEntry(null);
                  setAiSearchFilter(null);
                }}
                className={!showOnlyMine ? 'is-active' : ''}
                aria-pressed={!showOnlyMine}
                title={isDemoMode ? "Show your circle's public memories" : 'Explore public travel memories'}
              >
                <List size={15} />
                <span>{isDemoMode ? 'Circle' : 'Explore'}</span>
                {isDemoMode && <small>{personalAtlasEntries.length + DEMO_FRIEND_ENTRIES.length}</small>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOnlyMine(true);
                  setSelectedEntry(null);
                  setAiSearchFilter(null);
                }}
                className={showOnlyMine ? 'is-active' : ''}
                aria-pressed={showOnlyMine}
                title="Show only my memories"
              >
                <MapPin size={15} /> <span>Mine</span>
                {isDemoMode && <small>{personalAtlasEntries.length}</small>}
              </button>
            </nav>

            <button type="button" onClick={() => setIsSidebarOpen(true)} className="app-utility-button" title="Open memories" data-tour="memories-rediscover">
              <BookOpen size={17} /> <span>Memories</span>
            </button>

            <button type="button" onClick={openSocial} className="app-utility-button" title="Explorer community">
              <Users size={17} /> <span>People</span>
            </button>

            <button type="button" onClick={openInspiration} className="app-utility-button inspiration-trigger" title="Memory-led travel inspiration">
              <Lightbulb size={17} /> <span>Inspire</span>
            </button>

            <button type="button" onClick={openProfile} className="app-profile-button" title="Open explorer profile" aria-label="Open explorer profile">
              {visibleProfile?.photoURL ? (
                <img src={visibleProfile.photoURL} alt="" />
              ) : (
                <span className="app-avatar-fallback"><UserIcon size={16} /></span>
              )}
              <span className="app-profile-copy">
                <strong>{visibleProfile?.displayName || 'Explorer'}</strong>
                <small>@{visibleProfile?.username || 'traveler'}</small>
              </span>
              {profileCountryBadges[0] && (
                <span
                  className="app-profile-country-badge"
                  title={`${profileCountryBadges[0].country} Pathfinder · ${profileCountryBadges[0].cityCount} cities`}
                  role="img"
                  aria-label={`${profileCountryBadges[0].country} Pathfinder badge`}
                >
                  {profileCountryBadges[0].emoji}
                </span>
              )}
            </button>

            <button type="button" onClick={() => void exitAtlas()} className="app-icon-button" title={isDemoMode ? 'Exit demo Atlas' : 'Log out'} aria-label={isDemoMode ? 'Exit demo Atlas' : 'Log out'}>
              <LogOut size={17} />
            </button>
          </div>
        </header>
      )}

      {/* 2. Main 3D Globe / 2D Map Canvas view */}
      <main className="w-full h-full">
        {viewMode === 'globe' ? (
          <ErrorBoundary onError={(error) => {
            let msg = '';
            if (error instanceof Error) msg = error.message || '';
            else if (typeof error === 'string') msg = error;
            else if (error && typeof (error as any).message === 'string') msg = (error as any).message;
            
            if (msg.toLowerCase().includes('webgl')) {
              setViewMode('map');
            }
          }}>

            <GlobeView
              entries={atlasEntries}
              selectedEntry={selectedEntry}
              onSelectEntry={handleSelectEntry}
              filteredIds={aiSearchFilter}
              currentUserId={visibleProfile?.uid}
              authorProfiles={isDemoMode ? DEMO_PROFILES_BY_ID : undefined}
            />
          </ErrorBoundary>
        ) : (
          <LeafletMap
            entries={atlasEntries}
            selectedEntry={selectedEntry}
            onSelectEntry={handleSelectEntry}
            currentUserId={visibleProfile?.uid}
            filteredIds={aiSearchFilter}
            authorProfiles={isDemoMode ? DEMO_PROFILES_BY_ID : undefined}
          />
        )}
      </main>

      {hasAtlasAccess && isDemoMode && (
        <aside
          className={`atlas-scope-board ${showOnlyMine ? 'is-mine' : 'is-circle'}`}
          data-tour="atlas-board"
          aria-live="polite"
          aria-label={showOnlyMine ? 'Mine view showing only your pins' : 'Circle view showing your pins and friend pins'}
        >
          <div className="atlas-scope-board-heading">
            <span>Visible on this Atlas</span>
            <strong>{showOnlyMine ? 'Mine · personal focus' : 'Circle · shared world'}</strong>
          </div>
          <div className="atlas-scope-board-counts">
            <span><i className="is-own" /> <b>{personalAtlasEntries.length}</b> my pins</span>
            {!showOnlyMine && <span><i className="is-friend" /> <b>{friendPinCount}</b> friend pins</span>}
            <small>{showOnlyMine ? 'Friends are hidden' : `${atlasEntries.length} pins total`}</small>
          </div>
        </aside>
      )}

      {!hasAtlasAccess && (
        <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} onPreviewDemo={enterDemoAtlas} />
      )}

      {hasAtlasAccess && (
        <>
          {/* 3. Left drawer entries list sidebar */}
          <Sidebar
        entries={entries}
        selectedEntry={selectedEntry}
        onSelectEntry={handleSelectEntry}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenPro={() => setIsSubscriptionOpen(true)}
        profile={visibleProfile}
        onOpenProfile={openProfile}
      />

      {/* 4. selected memory popup details card */}
      <EntryCard
        entry={selectedEntry}
        author={selectedEntry?.authorId ? DEMO_PROFILES_BY_ID[selectedEntry.authorId] : null}
        isOwn={selectedEntry?.authorId === visibleProfile?.uid}
        onClose={() => setSelectedEntry(null)}
        onDelete={handleDeleteEntry}
        canManage={Boolean(
          selectedEntry
          && (isDemoMode
            ? selectedEntry.authorId === DEMO_PROFILE.uid
            : user && selectedEntry.authorId === user.uid)
        )}
        onEdit={() => {
          const canEditDemoMemory = isDemoMode && selectedEntry?.authorId === DEMO_PROFILE.uid;
          const canEditCloudMemory = !isDemoMode && user && selectedEntry?.authorId === user.uid;
          if (selectedEntry && (canEditDemoMemory || canEditCloudMemory)) {
            setEditingEntry(selectedEntry);
            setIsCreateOpen(true);
          }
        }}
      />

      {/* 5. One coordinated Atlas dock keeps map utilities and creation actions
          in a single collision-free zone. */}
      <div className="atlas-dock" role="toolbar" aria-label="Atlas controls" data-tour="nexus-add">
        <button
          type="button"
          onClick={() => setViewMode((current) => current === 'globe' ? 'map' : 'globe')}
          className="atlas-dock-action"
          aria-label={viewMode === 'globe' ? 'Switch to 2D map' : 'Switch to 3D globe'}
          title={viewMode === 'globe' ? 'Switch to 2D map' : 'Return to 3D globe'}
        >
          {viewMode === 'globe' ? <MapIcon size={18} /> : <Globe2 size={18} />}
          <span>{viewMode === 'globe' ? '2D map' : '3D globe'}</span>
        </button>

        <span className="atlas-dock-divider" aria-hidden="true" />

        <button type="button" onClick={openNexus} className="atlas-dock-action atlas-nexus-action">
          <Sparkles size={18} />
          <span>Nexus</span>
        </button>

        <button type="button" onClick={openCreate} className="atlas-dock-action atlas-add-action">
          <Plus size={19} />
          <span>Add memory</span>
        </button>
      </div>

      {/* 6. Form panel modal for creating entry */}
      <CreateEntryPanel
        isOpen={isCreateOpen}
        onClose={handleCloseCreatePanel}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
      />

      {/* 8. Social Panel */}
      <SocialPanel
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
        demoMode={isDemoMode}
        demoExplorers={DEMO_EXPLORERS}
        onDemoInviteAccepted={(pinId) => {
          const acceptedEntry = DEMO_SHARED_ENTRIES.find((entry) => entry.id === pinId);
          if (!acceptedEntry) return;
          setEntries((current) => current.some((entry) => entry.id === acceptedEntry.id)
            ? current
            : [...current, acceptedEntry]);
        }}
        onOpenExplorer={(explorer) => {
          setIsSocialOpen(false);
          setSelectedEntry(null);
          setExplorerProfile(explorer);
        }}
      />

      {/* 10. Data Import Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        demoMode={isDemoMode}
        demoAuthorId={DEMO_PROFILE.uid}
        onDemoImport={(importedEntries) => {
          setEntries((current) => {
            const importedIds = new Set(importedEntries.map((entry) => entry.id));
            return [...importedEntries, ...current.filter((entry) => !importedIds.has(entry.id))];
          });
          setShowOnlyMine(true);
          setSelectedEntry(null);
        }}
        onImportComplete={() => {
          setShowOnlyMine(true);
          setSelectedEntry(null);
          refreshPins();
        }}
      />

      {/* 11. AI Copilot */}
      <AICopilotPanel
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        entries={entries}
      />

      {/* 12. Dodo Payments Subscription */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <InspirationPanel
        isOpen={isInspirationOpen}
        onClose={() => setIsInspirationOpen(false)}
        entries={entries}
        onOpenMemory={(entry) => {
          setIsInspirationOpen(false);
          setShowOnlyMine(false);
          handleSelectEntry(entry);
        }}
      />

      <ExplorerAtlasPanel
        explorer={explorerProfile}
        onClose={() => setExplorerProfile(null)}
        previewEntries={isDemoMode ? DEMO_FRIEND_ENTRIES : undefined}
      />
        </>
      )}

      {/* 7. Auth Modal */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      
      {/* 9. Profile Panel */}
      {hasAtlasAccess && visibleProfile && (
        <ProfilePanel 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          profile={visibleProfile}
          entries={entries}
          demoMode={isDemoMode}
        />
      )}

      {user && profile && profile.onboardingCompleted !== true && (
        <ProfileSetupModal profile={profile} onComplete={() => undefined} />
      )}

      {hasAtlasAccess && isDemoMode && (
        <DemoTour onStepChange={prepareDemoTourStep} />
      )}

    </div>
  );
}

export default App;
