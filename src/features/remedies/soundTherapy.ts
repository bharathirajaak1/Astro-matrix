export interface SoundFrequency {
  id: string;
  frequency: number; // Hz
  name: string;
  associatedNumber: number;
  chakra: string;
  purpose: string;
  toneUrl: string; // Direct royalty-free ambient frequency streams / audio presets
  durationSeconds: number;
}

export const SOUND_FREQUENCIES: Record<number, SoundFrequency> = {
  1: {
    id: 'freq_1',
    frequency: 741,
    name: '741 Hz — Awakening Intuition',
    associatedNumber: 1,
    chakra: 'Throat & Crown',
    purpose: 'Clear expression, executive decision-making, and leadership flow.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6027a051.mp3',
    durationSeconds: 180,
  },
  2: {
    id: 'freq_2',
    frequency: 639,
    name: '639 Hz — Heart Connection',
    associatedNumber: 2,
    chakra: 'Heart',
    purpose: 'Harmonizing relationships, emotional patience, and interpersonal ease.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c7c97839.mp3',
    durationSeconds: 180,
  },
  3: {
    id: 'freq_3',
    frequency: 528,
    name: '528 Hz — Miracle & Creation',
    associatedNumber: 3,
    chakra: 'Solar Plexus',
    purpose: 'Creative clarity, positive transformation, and joyful vitality.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_823d6a2f46.mp3',
    durationSeconds: 180,
  },
  4: {
    id: 'freq_4',
    frequency: 432,
    name: '432 Hz — Sacred Grounding',
    associatedNumber: 4,
    chakra: 'Earth Star',
    purpose: 'Stabilizing mental chatter, creating patience, and grounding physical focus.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    durationSeconds: 180,
  },
  5: {
    id: 'freq_5',
    frequency: 417,
    name: '417 Hz — Facilitating Change',
    associatedNumber: 5,
    chakra: 'Sacral',
    purpose: 'Releasing trauma, breaking stagnation, and easing transitions.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f75bf3.mp3',
    durationSeconds: 180,
  },
  6: {
    id: 'freq_6',
    frequency: 528,
    name: '528 Hz — Compassion & Family Harmony',
    associatedNumber: 6,
    chakra: 'Heart',
    purpose: 'Deep domestic peace, acceptance, and gentle unconditional love.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_823d6a2f46.mp3',
    durationSeconds: 180,
  },
  7: {
    id: 'freq_7',
    frequency: 852,
    name: '852 Hz — Returning to Spiritual Order',
    associatedNumber: 7,
    chakra: 'Third Eye',
    purpose: 'Dissolving overthinking, deepening meditation, and inner stillness.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    durationSeconds: 180,
  },
  8: {
    id: 'freq_8',
    frequency: 396,
    name: '396 Hz — Liberation from Fear & Guilt',
    associatedNumber: 8,
    chakra: 'Root',
    purpose: 'Anchoring financial discipline, clearing scarcity mindset, and endurance.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    durationSeconds: 180,
  },
  9: {
    id: 'freq_9',
    frequency: 963,
    name: '963 Hz — Pure Consciousness',
    associatedNumber: 9,
    chakra: 'Crown',
    purpose: 'Universal humanitarian alignment, closure, and spiritual fulfillment.',
    toneUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6027a051.mp3',
    durationSeconds: 180,
  },
};

export function getSoundFrequencyForNumber(digit: number): SoundFrequency {
  return SOUND_FREQUENCIES[digit] || SOUND_FREQUENCIES[4];
}