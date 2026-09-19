export interface ArchetypeProfile {
  title: string;
  archetype: string;
  description: string;
}

export const LIFE_PATH_ARCHETYPES: Record<number, ArchetypeProfile> = {
  1: {
    title: 'The Original Pioneer',
    archetype: 'The Pioneer',
    description: 'You are here to initiate, lead from the front, and forge uncharted territory. Your natural drive is boundless—your challenge is overcoming self-doubt and isolation.',
  },
  2: {
    title: 'The Intuitive Diplomat',
    archetype: 'The Diplomat',
    description: 'You are here to heal connections, cultivate harmony, and sense what remains unsaid. Your sensitivity is your superpower—your challenge is guarding your emotional boundaries.',
  },
  3: {
    title: 'The Expressive Luminary',
    archetype: 'The Luminary',
    description: 'You are here to communicate, create, and uplift human spirits. Your voice holds healing frequency—your challenge is channeling scattered creative sparks into finished mastery.',
  },
  4: {
    title: 'The Master Architect',
    archetype: 'The Architect',
    description: 'You are here to build unshakable foundations, systems, and legacies. Your endurance is unmatched—your challenge is releasing rigid control and embracing change.',
  },
  5: {
    title: 'The Free Spirit Catalyst',
    archetype: 'The Catalyst',
    description: 'You are here to break stagnation, explore frontiers, and embrace personal freedom. Your adaptability inspires others—your challenge is grounding yourself before burning out.',
  },
  6: {
    title: 'The Compassionate Guardian',
    archetype: 'The Guardian',
    description: 'You are here to protect, nurture, and create sanctuary for your loved ones. Your heart is generous—your challenge is stopping yourself from over-sacrificing your own needs.',
  },
  7: {
    title: 'The Sacred Truth Seeker',
    archetype: 'The Truth Seeker',
    description: 'You are here to uncover hidden knowledge, master introspection, and seek spiritual wisdom. Your intuition is piercing—your challenge is trusting the outer world.',
  },
  8: {
    title: 'The Sovereign Manifestor',
    archetype: 'The Manifestor',
    description: 'You are here to master material abundance, executive influence, and karmic balance. Your ambition moves mountains—your challenge is defining success beyond mere control.',
  },
  9: {
    title: 'The Wise Healer',
    archetype: 'The Wise Healer',
    description: 'You are here to serve humanity, complete karmic cycles, and elevate collective consciousness. Your compassion is boundless—your challenge is learning to receive, not just give.',
  },
  11: {
    title: 'The Master Intuitive',
    archetype: 'The Illuminator',
    description: 'You carry high spiritual voltage and profound intuition. Your mission is inspiring others through illumination—your challenge is managing nervous tension and self-doubt.',
  },
  22: {
    title: 'The Master Builder',
    archetype: 'The Master Architect',
    description: 'You possess the rare power to turn grand spiritual visions into physical reality. Your challenge is overcoming intimidation by your own potential.',
  },
  33: {
    title: 'The Master Teacher',
    archetype: 'The Cosmic Nurturer',
    description: 'You are called to universal service and unconditional compassion. Your challenge is carrying the emotional weight of others without losing yourself.',
  },
};


export const DESTINY_ARCHETYPES: Record<number, ArchetypeProfile> = {
  1: {
    title: 'Self-Determined Leader',
    archetype: 'The Leader',
    description: 'Your life mission calls you to stand on your own two feet and innovate solutions that grant others genuine independence.',
  },
  2: {
    title: 'Peacemaker & Anchor',
    archetype: 'The Peacemaker',
    description: 'Your life mission is bringing divided people and situations into gentle, lasting alignment through empathetic listening.',
  },
  3: {
    title: 'The Expressive Creator',
    archetype: 'The Creator',
    description: 'Your life purpose is to communicate, create, and bring joy to others. When you express yourself authentically, abundance flows naturally.',
  },
  4: {
    title: 'System Builder',
    archetype: 'The Builder',
    description: 'Your life purpose is establishing order, tangible security, and enduring practices that withstand the test of time.',
  },
  5: {
    title: 'Transformational Agent',
    archetype: 'The Agent',
    description: 'Your purpose is teaching others how to adapt, navigate fearlessly through pivots, and embrace evolutionary growth.',
  },
  6: {
    title: 'Community Healer',
    archetype: 'The Caretaker',
    description: 'Your life calling is elevating domestic balance, emotional healing, and providing warmth to wounded hearts.',
  },
  7: {
    title: 'Deep Philosopher',
    archetype: 'The Philosopher',
    description: 'Your life calling is deciphering universal mysteries, analyzing truths, and elevating inner awareness over worldly noise.',
  },
  8: {
    title: 'Architect of Legacy',
    archetype: 'The Executive',
    description: 'Your mission is directing high-impact resources, ethical wealth, and enterprise to empower large communities.',
  },
  9: {
    title: 'Universal Benefactor',
    archetype: 'The Benefactor',
    description: 'Your ultimate purpose is philanthropic contribution, letting go of personal ego, and leaving the planet more enlightened.',
  },
  11: {
    title: 'The Spiritual Visionary',
    archetype: 'The Illuminator',
    description: 'Your life mission calls you to be a beacon of spiritual awareness, bridging deep intuitive insight with practical world transformation.',
  },
  22: {
    title: 'Architect of Legacies',
    archetype: 'The Master Builder',
    description: 'Your life calling is designing global systems, institutions, or tangible structures that serve human elevation across generations.',
  },
  33: {
    title: 'Universal Healer',
    archetype: 'The Master Teacher',
    description: 'Your life mission is lifting collective suffering and embodying selflessness, devotion, and healing at a profound scale.',
  },
};

export const SOUL_URGE_ARCHETYPES: Record<number, ArchetypeProfile> = {
  1: {
    title: 'Autonomy & Originality',
    archetype: 'The Trailblazer',
    description: 'Deep inside, your spirit yearns to be first, free from micromanagement, and honored for your standalone genius.',
  },
  2: {
    title: 'Intimacy & Warmth',
    archetype: 'The Companion',
    description: 'Deep inside, you crave genuine soulful companionship, tender emotional safety, and peaceful collaboration.',
  },
  3: {
    title: 'The Joy Seeker',
    archetype: 'The Joy Seeker',
    description: 'Deep down, you crave creative freedom and meaningful connection. You are happiest when you are creating, expressing, and sharing with others.',
  },
  4: {
    title: 'Order & Certainty',
    archetype: 'The Anchor',
    description: 'At the deepest level, your soul seeks predictable structure, reliable bonds, and unassailable safety.',
  },
  5: {
    title: 'Wild Liberation',
    archetype: 'The Explorer',
    description: 'Deep inside, you crave total spontaneous freedom, adventure, variety, and the liberty to change direction at will.',
  },
  6: {
    title: 'Devoted Harmony',
    archetype: 'The Heart',
    description: 'Your innermost desire is to be cherished, create a peaceful sanctuary, and protect those in your care.',
  },
  7: {
    title: 'Silent Knowing',
    archetype: 'The Mystic',
    description: 'Deep down, your soul hungers for quiet solitude, spiritual connection, and uninterrupted contemplative space.',
  },
  8: {
    title: 'Unapologetic Power',
    archetype: 'The Sovereign',
    description: 'Your soul craves recognition, executive authority, and the personal freedom that only true financial sovereignty provides.',
  },
  9: {
    title: 'Cosmic Compassion',
    archetype: 'The Altruist',
    description: 'Deep down, your spirit yearns to lift suffering, offer forgiveness, and know that your existence made the world softer.',
  },
  11: {
    title: 'Spiritual Illumination',
    archetype: 'The Mystic Channel',
    description: 'Deep inside, your soul yearns for transcendent understanding, cosmic connection, and living in alignment with intuitive truth.',
  },
  22: {
    title: 'Monumental Creation',
    archetype: 'The Monument Builder',
    description: 'Your soul deeply craves leaving a permanent mark on humanity through large-scale, enduring practical manifestations.',
  },
  33: {
    title: 'Selfless Devotion',
    archetype: 'The Universal Heart',
    description: 'Deep inside, your spirit yearns to pour unconditional love into every soul you meet and protect the vulnerable.',
  },
};

export const NUMBER_TRAITS: Record<
  number,
  { name: string; activeTrait: string; missingImpact: string; unlockOpportunity: string }
> = {
  1: {
    name: 'Initiative & Independence',
    activeTrait: 'Leadership, decisive action, and clear personal identity',
    missingImpact: 'Tendency to doubt your authority and wait for external permission',
    unlockOpportunity: 'Decisive executive self-confidence and self-reliance',
  },
  2: {
    name: 'Sensitivity & Connection',
    activeTrait: 'Deep sensitivity, emotional intuition, and partnership skills',
    missingImpact: 'Impatience with interpersonal subtleties or difficulty opening up',
    unlockOpportunity: 'Effortless relational harmony and deep empathetic rapport',
  },
  3: {
    name: 'Expression & Optimism',
    activeTrait: 'Creative expression, verbal charisma, and natural optimism',
    missingImpact: 'Creative expression may feel blocked, criticized, or scattered',
    unlockOpportunity: 'Uninhibited creative output and magnetic personal presence',
  },
  4: {
    name: 'Discipline & Structure',
    activeTrait: 'Methodical planning, practical execution, and grounded stability',
    missingImpact: 'Structure, routine, and follow-through feel difficult to maintain',
    unlockOpportunity: 'Rock-solid daily consistency and steady financial momentum',
  },
  5: {
    name: 'Adaptability & Freedom',
    activeTrait: 'Adaptability, adventurous spirit, and ease with change',
    missingImpact: 'Fear of sudden life transitions and reluctance to leave safe zones',
    unlockOpportunity: 'Fearless adaptability and freedom from rigid thinking',
  },
  6: {
    name: 'Nurturing & Responsibility',
    activeTrait: 'Unconditional care, domestic warmth, and emotional loyalty',
    missingImpact: 'May struggle to nurture yourself and establish balanced self-care',
    unlockOpportunity: 'Deep emotional fulfillment and balanced relationship boundaries',
  },
  7: {
    name: 'Intuition & Introspection',
    activeTrait: 'Spiritual depth, analytical brilliance, and inner stillness',
    missingImpact: 'Tendency to avoid introspection and overthink decisions rationally',
    unlockOpportunity: 'Clear instinctive intuition and quiet mental peace',
  },
  8: {
    name: 'Ambition & Abundance',
    activeTrait: 'Ambition, financial acumen, and organizational authority',
    missingImpact: 'Unease around financial discipline or feeling blocked in material goals',
    unlockOpportunity: 'Material stability, executive mastery, and wealth confidence',
  },
  9: {
    name: 'Wisdom & Completion',
    activeTrait: 'Broad humanitarian vision, empathy, and ability to complete cycles',
    missingImpact: 'Struggle to complete emotional cycles, close chapters, and let go',
    unlockOpportunity: 'Graceful emotional closure and universal magnetic influence',
  },
};