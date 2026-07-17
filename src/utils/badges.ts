import { Compass, Map, Tent, Camera, Palmtree, Utensils, Mountain, Award } from 'lucide-react';
import React from 'react';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'achievement' | 'country';
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Category Badges
  trekker: {
    id: 'trekker',
    name: 'Trekker',
    description: 'Awarded for pinning your first trek!',
    icon: Mountain,
    color: '#34d399', // emerald-400
    category: 'achievement',
  },
  beach_bum: {
    id: 'beach_bum',
    name: 'Beach Bum',
    description: 'Awarded for pinning a beach memory!',
    icon: Palmtree,
    color: '#fbbf24', // amber-400
    category: 'achievement',
  },
  city_slicker: {
    id: 'city_slicker',
    name: 'City Slicker',
    description: 'Awarded for exploring the concrete jungle!',
    icon: Map,
    color: '#60a5fa', // blue-400
    category: 'achievement',
  },
  nature_lover: {
    id: 'nature_lover',
    name: 'Nature Lover',
    description: 'Awarded for getting lost in nature!',
    icon: Tent,
    color: '#10b981', // emerald-500
    category: 'achievement',
  },
  foodie: {
    id: 'foodie',
    name: 'Foodie',
    description: 'Awarded for documenting delicious culinary adventures!',
    icon: Utensils,
    color: '#f43f5e', // rose-500
    category: 'achievement',
  },
  shutterbug: {
    id: 'shutterbug',
    name: 'Shutterbug',
    description: 'Awarded for capturing the perfect shot!',
    icon: Camera,
    color: '#a78bfa', // violet-400
    category: 'achievement',
  },
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Awarded for creating your very first pin!',
    icon: Compass,
    color: '#00f0ff', // cyan accent
    category: 'achievement',
  }
};

export const getBadgeDefinition = (badgeId: string): BadgeDefinition => {
  // If it's a known static badge
  if (BADGE_DEFINITIONS[badgeId]) {
    return BADGE_DEFINITIONS[badgeId];
  }
  
  // If it's a dynamic country badge (e.g., country_France)
  if (badgeId.startsWith('country_')) {
    const countryName = badgeId.replace('country_', '').replace(/_/g, ' ');
    return {
      id: badgeId,
      name: countryName,
      description: `Awarded for visiting ${countryName}!`,
      icon: Award,
      color: '#ffd700', // Gold
      category: 'country',
    };
  }

  // Fallback
  return {
    id: badgeId,
    name: 'Unknown Badge',
    description: 'A mysterious achievement.',
    icon: Award,
    color: '#9ca3af',
    category: 'achievement',
  };
};
