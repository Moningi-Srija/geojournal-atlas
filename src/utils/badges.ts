import React from 'react';
import {
  Award,
  Camera,
  Compass,
  Globe2,
  Landmark,
  Map as MapIcon,
  Mountain,
  Palmtree,
  Tent,
  Utensils,
} from 'lucide-react';
import type { EntryCategory, JournalEntry } from '../types';

export type BadgeMetric =
  | { kind: 'entries' }
  | { kind: 'category'; category: EntryCategory }
  | { kind: 'photos' }
  | { kind: 'countries' };

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'achievement' | 'country';
  target?: number;
  metric?: BadgeMetric;
}

export interface BadgeProgress {
  current: number;
  target: number;
  percent: number;
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Create your first memory on the Atlas.',
    icon: Compass,
    color: '#22d3ee',
    category: 'achievement',
    target: 1,
    metric: { kind: 'entries' },
  },
  trekker: {
    id: 'trekker',
    name: 'Trailblazer',
    description: 'Log 3 trek memories.',
    icon: Mountain,
    color: '#34d399',
    category: 'achievement',
    target: 3,
    metric: { kind: 'category', category: 'trek' },
  },
  beach_bum: {
    id: 'beach_bum',
    name: 'Coast Chaser',
    description: 'Log 3 beach memories.',
    icon: Palmtree,
    color: '#fbbf24',
    category: 'achievement',
    target: 3,
    metric: { kind: 'category', category: 'beach' },
  },
  city_slicker: {
    id: 'city_slicker',
    name: 'City Slicker',
    description: 'Log 3 city memories.',
    icon: MapIcon,
    color: '#60a5fa',
    category: 'achievement',
    target: 3,
    metric: { kind: 'category', category: 'city' },
  },
  nature_lover: {
    id: 'nature_lover',
    name: 'Nature Lover',
    description: 'Log 5 nature memories.',
    icon: Tent,
    color: '#10b981',
    category: 'achievement',
    target: 5,
    metric: { kind: 'category', category: 'nature' },
  },
  foodie: {
    id: 'foodie',
    name: 'Local Foodie',
    description: 'Log 5 food memories.',
    icon: Utensils,
    color: '#fb7185',
    category: 'achievement',
    target: 5,
    metric: { kind: 'category', category: 'food' },
  },
  culture_seeker: {
    id: 'culture_seeker',
    name: 'Culture Seeker',
    description: 'Log 3 culture memories.',
    icon: Landmark,
    color: '#c084fc',
    category: 'achievement',
    target: 3,
    metric: { kind: 'category', category: 'culture' },
  },
  shutterbug: {
    id: 'shutterbug',
    name: 'Shutterbug',
    description: 'Add 10 photos across your memories.',
    icon: Camera,
    color: '#a78bfa',
    category: 'achievement',
    target: 10,
    metric: { kind: 'photos' },
  },
  globetrotter: {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'Collect memories in 5 different countries.',
    icon: Globe2,
    color: '#f59e0b',
    category: 'achievement',
    target: 5,
    metric: { kind: 'countries' },
  },
};

const normaliseCountry = (country: string) => country.trim().replace(/\s+/g, ' ');

const normaliseCity = (locationName: string) => (
  locationName
    .split(',')[0]
    .trim()
    .replace(/\s+/g, ' ')
);

export const COUNTRY_BADGE_CITY_TARGET = 4;

const COUNTRY_BADGE_EMOJIS: Record<string, string> = {
  colombia: '🇨🇴',
  france: '🇫🇷',
  germany: '🇩🇪',
  india: '🇮🇳',
  japan: '🇯🇵',
  morocco: '🇲🇦',
  norway: '🇳🇴',
  portugal: '🇵🇹',
  singapore: '🇸🇬',
  switzerland: '🇨🇭',
  tanzania: '🇹🇿',
  türkiye: '🇹🇷',
  turkey: '🇹🇷',
  'united states': '🇺🇸',
  usa: '🇺🇸',
};

export interface CountryBadgeMilestone {
  id: string;
  country: string;
  emoji: string;
  cityCount: number;
  cities: string[];
}

export const getCountryBadgeEmoji = (country: string) => (
  COUNTRY_BADGE_EMOJIS[normaliseCountry(country).toLocaleLowerCase()] ?? '🧭'
);

export const getCountryBadgeMilestones = (
  entries: JournalEntry[],
  cityTarget = COUNTRY_BADGE_CITY_TARGET,
): CountryBadgeMilestone[] => {
  const countryCities = new Map<string, { country: string; cities: Map<string, string> }>();

  entries.forEach((entry) => {
    if (!entry.country?.trim() || !entry.locationName?.trim()) return;
    const country = normaliseCountry(entry.country);
    const city = normaliseCity(entry.locationName);
    if (!city) return;

    const countryKey = country.toLocaleLowerCase();
    const current = countryCities.get(countryKey) ?? {
      country,
      cities: new Map<string, string>(),
    };
    current.cities.set(city.toLocaleLowerCase(), city);
    countryCities.set(countryKey, current);
  });

  return [...countryCities.values()]
    .filter(({ cities }) => cities.size >= cityTarget)
    .map(({ country, cities }) => ({
      id: getCountryBadgeId(country),
      country,
      emoji: getCountryBadgeEmoji(country),
      cityCount: cities.size,
      cities: [...cities.values()],
    }))
    .sort((a, b) => b.cityCount - a.cityCount || a.country.localeCompare(b.country));
};

const CATEGORY_KEYWORDS: Record<EntryCategory, string[]> = {
  trek: ['trek', 'hike', 'hiking', 'trail', 'summit', 'mountain', 'climb'],
  beach: ['beach', 'coast', 'coastal', 'ocean', 'sea', 'shore', 'surf'],
  city: ['city', 'downtown', 'skyline', 'street', 'urban', 'metro'],
  nature: ['nature', 'forest', 'wildlife', 'waterfall', 'lake', 'camp', 'park'],
  food: ['food', 'restaurant', 'cafe', 'coffee', 'latte', 'bakery', 'dinner', 'lunch'],
  culture: ['culture', 'museum', 'temple', 'heritage', 'gallery', 'monument', 'historic'],
  general: [],
};

const entryMatchesCategory = (entry: JournalEntry, category: EntryCategory) => {
  if (entry.category === category) return true;
  if (category === 'general') return entry.category === 'general';

  const text = `${entry.title} ${entry.body} ${entry.locationName}`.toLocaleLowerCase();
  return CATEGORY_KEYWORDS[category].some((keyword) => text.includes(keyword));
};

export const getCountryBadgeId = (country: string) =>
  `country_${normaliseCountry(country).toLocaleLowerCase().replace(/[\s/]+/g, '_').replace(/^_+|_+$/g, '')}`;

export const getDistinctCountries = (entries: JournalEntry[]) => {
  const countries = new Map<string, string>();
  entries.forEach((entry) => {
    if (!entry.country?.trim()) return;
    const displayName = normaliseCountry(entry.country);
    countries.set(displayName.toLocaleLowerCase(), displayName);
  });
  return [...countries.values()];
};

export const getBadgeProgress = (
  badge: BadgeDefinition,
  entries: JournalEntry[],
): BadgeProgress => {
  const target = badge.target ?? 1;
  const metric = badge.metric;
  let current = 0;

  switch (metric?.kind) {
    case 'entries':
      current = entries.length;
      break;
    case 'category':
      // Category selection is the strongest signal, while the keyword pass keeps
      // free-form journals presentation-friendly and unlocks achievements from prose.
      current = entries.filter((entry) => entryMatchesCategory(entry, metric.category)).length;
      break;
    case 'photos':
      current = entries.reduce(
        (total, entry) => total + (entry.photos?.length ?? 0) + (entry.googlePhotosUrl ? 1 : 0),
        0,
      );
      break;
    case 'countries':
      current = getDistinctCountries(entries).length;
      break;
    default:
      current = 0;
  }

  return {
    current,
    target,
    percent: Math.min(100, Math.round((current / target) * 100)),
  };
};

export const getEarnedBadgeIds = (entries: JournalEntry[]) => {
  const achievementIds = Object.values(BADGE_DEFINITIONS)
    .filter((badge) => {
      const progress = getBadgeProgress(badge, entries);
      return progress.current >= progress.target;
    })
    .map((badge) => badge.id);

  const countryIds = getCountryBadgeMilestones(entries)
    .map((milestone) => milestone.id)
    .filter((id) => id !== 'country_');

  return [...achievementIds, ...countryIds];
};

export const getBadgeDefinition = (badgeId: string): BadgeDefinition => {
  if (BADGE_DEFINITIONS[badgeId]) return BADGE_DEFINITIONS[badgeId];

  if (badgeId.startsWith('country_')) {
    const countryName = badgeId
      .replace('country_', '')
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      id: badgeId,
      name: countryName || 'Passport Stamp',
      description: `Explore ${COUNTRY_BADGE_CITY_TARGET} or more cities across ${countryName || 'a new destination'}.`,
      icon: Award,
      color: '#facc15',
      category: 'country',
    };
  }

  return {
    id: badgeId,
    name: 'Legacy Achievement',
    description: 'An achievement from an earlier Atlas adventure.',
    icon: Award,
    color: '#9ca3af',
    category: 'achievement',
  };
};
