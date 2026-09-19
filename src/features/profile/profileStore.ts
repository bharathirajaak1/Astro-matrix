import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  fullName: string;
  dob: string; // YYYY-MM-DD
  system: 'Pythagorean' | 'Chaldean' | 'Vedic';
  isSampleUser: boolean;
  hasAcceptedDisclaimer: boolean;
}

export interface SwotBlueprint {
  superpower: {
    title: string;
    description: string[];
    tag: string;
  };
  blindSpot: {
    title: string;
    description: string[];
    tag: string;
  };
  goldenTicket: {
    title: string;
    description: string[];
    tag: string;
  };
}

const PROFILE_KEY = '@astro_matrix_user_profile';
const ONBOARDED_KEY = '@astro_matrix_has_onboarded';

export const SAMPLE_PROFILE: UserProfile = {
  fullName: 'Cosmic Seeker',
  dob: '1995-05-15',
  system: 'Pythagorean',
  isSampleUser: true,
  hasAcceptedDisclaimer: true,
};

export function calculateSwot(dob: string, name: string): SwotBlueprint {
  if (dob === '1995-05-15') {
    return {
      superpower: {
        tag: 'Life Path 8',
        title: 'Architect of Abundance & Strategic Vision',
        description: [
          'Effortless manifestation of material resources.',
          'Natural authority, high resilience under pressure.',
          'Deep strategic clarity where others see chaos.',
        ],
      },
      blindSpot: {
        tag: 'Missing Plane 4',
        title: 'Micromanagement Fatigue & Routine Friction',
        description: [
          'Pushing through burnout without physical rest.',
          'Resistance to repetitive administrative tasks.',
          'Difficulty delegating operational control.',
        ],
      },
      goldenTicket: {
        tag: 'Day Number 6',
        title: 'The Empowered Patron & Creative Guardian',
        description: [
          'Abundance unlocks when building enterprises that protect and nurture community.',
          'Favorable Environments: Leadership, design, impact ventures, and mentorship platforms.',
        ],
      },
    };
  }

  // Dynamic calculation for other entered dates
  const parts = dob.split('-').map(Number);
  const day = parts[2] || 1;
  const dayReduced = ((day - 1) % 9) + 1;

  return {
    superpower: {
      tag: `Day Number ${dayReduced}`,
      title: 'Intuitive Catalyst & Expression',
      description: [
        'Natural ability to connect distinct ideas effortlessly.',
        'High adaptability in dynamic, changing environments.',
        'Clear communicative magnetism that inspires others.',
      ],
    },
    blindSpot: {
      tag: 'Grounded Action',
      title: 'Inconsistent Pacing & Routine Resistance',
      description: [
        'Starting projects with intense enthusiasm then stalling.',
        'Over-reliance on mood rather than structured systems.',
        'Postponing quiet self-reflection when schedule gets packed.',
      ],
    },
    goldenTicket: {
      tag: 'Alignment Pathway',
      title: 'Strategic Foundation & Focused Execution',
      description: [
        'True breakthroughs arrive through daily 5-minute micro-habits.',
        'Favorable Areas: Systems architecture, advisory roles, and mindful creative leadership.',
      ],
    },
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

export async function checkHasOnboarded(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function clearProfileData(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
  await AsyncStorage.removeItem(ONBOARDED_KEY);
}