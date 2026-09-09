export interface ElaboratedRemedy {
  number: number;
  title: string;
  keyword: string;
  powerColor: { name: string; description: string };
  microRitual: {
    title: string;
    whatToDo: string;
    howToDoIt: string;
    whyItWorks: string;
    whatToExp: string;
  };
  affirmation: string;
  gemstone: { primary: string; alternative: string; ritual: string };
  luckyDay: string;
  food: string;
  bonusTip: string;
}

export const EXPANDED_REMEDIES: Record<number, ElaboratedRemedy> = {
  1: {
    number: 1,
    title: 'Leadership & New Beginnings',
    keyword: 'Initiation',
    powerColor: {
      name: 'Red or Orange',
      description: 'Red ignites inner fire and bold action. Wear a red accessory—a tie, bracelet, or socks. Let it remind you: "I am a pioneer. Ready to lead." Orange provides softer creative warmth.',
    },
    microRitual: {
      title: 'Start Something New',
      whatToDo: 'Initiate one small step on a delayed initiative before noon.',
      howToDoIt: 'Do not overplan. Draft sentence one, dial the number, or tap the first button directly.',
      whyItWorks: 'Number 1 thrives on initiation rather than perfection. Taking the first physical action breaks inertia.',
      whatToExp: 'Instant dissipation of mental resistance and renewed creative agency.',
    },
    affirmation: 'I am a pioneer. I lead with courage, not perfection. Every step I take creates a new path.',
    gemstone: {
      primary: 'Ruby',
      alternative: 'Garnet',
      ritual: 'Keep in your pocket or as a ring. Hold the stone when hesitating to re-anchor courage.',
    },
    luckyDay: 'Sunday Before Noon (Sun energy)',
    food: 'Spicy foods, pinch of red chili, cinnamon, or red apples.',
    bonusTip: 'Walk with shoulders back and head held high to reinforce leadership posture.',
  },
  2: {
    number: 2,
    title: 'Partnership & Diplomacy',
    keyword: 'Patience',
    powerColor: {
      name: 'White, Cream, or Pale Blue',
      description: 'Soft colors that signal approachability, inner calm, and open listening.',
    },
    microRitual: {
      title: 'Listen Without Interrupting',
      whatToDo: 'Practice active presence in your primary conversation today.',
      howToDoIt: 'Listen without forming answers. When the speaker pauses, hold silence for 3 seconds before responding.',
      whyItWorks: 'Activates feminine, diplomatic lunar energy, opening genuine interpersonal trust.',
      whatToExp: 'Deeper emotional alignment and reduced conversational friction.',
    },
    affirmation: 'I attract supportive people into my life. I trust the process, and I am patient. My connections are deep and meaningful.',
    gemstone: {
      primary: 'Moonstone',
      alternative: 'Pearl',
      ritual: 'Wear as a bracelet or pendant to retain emotional composure and intuition.',
    },
    luckyDay: 'Monday Evening (Moon energy)',
    food: 'Warm milk, herbal teas, or warm honey-infused alternatives.',
    bonusTip: 'Send an unprompted 1-sentence note of gratitude to someone who aided you recently.',
  },
  3: {
    number: 3,
    title: 'Creativity & Joy',
    keyword: 'Self-Expression',
    powerColor: {
      name: 'Yellow or Saffron',
      description: 'Activates the throat chakra and joyful solar energy. Wear yellow to amplify presence.',
    },
    microRitual: {
      title: 'Unfiltered Expression',
      whatToDo: 'Put 3 unedited, spontaneous thoughts or ideas onto physical paper.',
      howToDoIt: 'Write without backspacing, erasing, or self-criticism. Wild or silly thoughts are welcomed.',
      whyItWorks: 'Bypasses the inner critical censor, liberating trapped throat chakra energy.',
      whatToExp: 'Relief of mental heaviness and open verbal confidence.',
    },
    affirmation: 'My voice is worth hearing. I express myself freely and joyfully. My creativity flows without resistance.',
    gemstone: {
      primary: 'Yellow Sapphire',
      alternative: 'Citrine',
      ritual: 'Place citrine on your workspace to maintain joyful creative frequency.',
    },
    luckyDay: 'Thursday Morning (Jupiter expansion energy)',
    food: 'Turmeric, bananas, chickpeas, or a deliberate piece of dark chocolate.',
    bonusTip: 'Hum or sing aloud during your morning routine to open your vocal cords.',
  },
  4: {
    number: 4,
    title: 'Structure & Discipline',
    keyword: 'Stability',
    powerColor: {
      name: 'Earthen Brown or Forest Green',
      description: 'Connects directly to the earth element to encourage calm, grounded focus.',
    },
    microRitual: {
      title: 'Physical Foundation Reset',
      whatToDo: 'Organize one drawer or write exactly 3 primary non-negotiable tasks.',
      howToDoIt: 'Empty one physical space completely, wipe it down, and return only the essentials.',
      whyItWorks: 'External order instantly mirrors cognitive stability and eliminates overwhelm.',
      whatToExp: 'Grounded certainty and relief from scattered attention.',
    },
    affirmation: 'Small steps build strong foundations. I am consistent, and consistency creates results. My life is organized and stable.',
    gemstone: {
      primary: 'Emerald',
      alternative: 'Green Jade',
      ritual: 'Carry a green jade palm stone to ground restless, disorganized thoughts.',
    },
    luckyDay: 'Saturday Morning Before 10 AM (Saturn discipline energy)',
    food: 'Root vegetables: sweet potatoes, beets, carrots.',
    bonusTip: 'Wake up 15 minutes earlier without touching your phone; drink warm water in silence.',
  },
  5: {
    number: 5,
    title: 'Freedom & Adaptability',
    keyword: 'Adventure',
    powerColor: {
      name: 'Blue or Turquoise',
      description: 'Expands communication and invites healthy spontaneous movement.',
    },
    microRitual: {
      title: 'Break the Pattern',
      whatToDo: 'Alter one habitual physical path or daily decision.',
      howToDoIt: 'Walk a different street, try a new beverage, or wear an accessory you normally skip.',
      whyItWorks: 'Neuro-linguistically disrupts autopilot loops and expands mental agility.',
      whatToExp: 'Heightened awareness, freshness, and curiosity.',
    },
    affirmation: 'Change brings opportunity. I embrace the adventure of today. I am free to choose my path.',
    gemstone: {
      primary: 'Diamond',
      alternative: 'Aquamarine',
      ritual: 'Wear aquamarine to stay calm amidst fast-paced change.',
    },
    luckyDay: 'Wednesday Afternoon (Mercury agility)',
    food: 'Mixed ethnic foods, herbs, and diverse fresh spices.',
    bonusTip: 'Send a spontaneous message inviting a friend to a simple outing this week.',
  },
  6: {
    number: 6,
    title: 'Harmony & Responsibility',
    keyword: 'Unconditional Care',
    powerColor: {
      name: 'Indigo or Pink',
      description: 'Nurtures heart-centered communication and home-centered peace.',
    },
    microRitual: {
      title: 'Selfless Compassion Act',
      whatToDo: 'Perform one anonymous or unannounced act of service.',
      howToDoIt: 'Clear a shared space, pay for a stranger’s tea, or leave an uplifting note without your name.',
      whyItWorks: 'Dissolves ego fixation and anchors heart-frequency abundance.',
      whatToExp: 'Deep warmth, emotional grounding, and community connection.',
    },
    affirmation: 'I give love freely and receive it with gratitude. Caring for others is my strength, and I honor the relationships in my life.',
    gemstone: {
      primary: 'Emerald',
      alternative: 'Rose Quartz',
      ritual: 'Keep rose quartz near where you sleep to heal family tensions.',
    },
    luckyDay: 'Friday Evening (Venus relationship harmony)',
    food: 'Sweet juicy fruits: peaches, mangos, melons.',
    bonusTip: 'Write down 3 specific details you appreciate about your living space.',
  },
  7: {
    number: 7,
    title: 'Introspection & Wisdom',
    keyword: 'Inner Truth',
    powerColor: {
      name: 'Deep Violet or Sea Green',
      description: 'Deepens third-eye intuition and quiets mental chatter.',
    },
    microRitual: {
      title: '5 Minutes of Mindful Silence',
      whatToDo: 'Sit in stillness and witness your breathing without interference.',
      howToDoIt: 'Sit upright, hands relaxed. Observe thoughts like clouds without chasing or repelling them.',
      whyItWorks: 'Allows subconscious static to settle, clarifying spiritual intuition.',
      whatToExp: 'Mental stillness, centered perspective, and inner clarity.',
    },
    affirmation: 'I trust my inner wisdom and seek truth. Stillness reveals my answers, and I listen with patience.',
    gemstone: {
      primary: 'Amethyst',
      alternative: "Cat's Eye",
      ritual: 'Rest an amethyst crystal near your bed to clarify nocturnal insights.',
    },
    luckyDay: 'Tuesday After Sunset (Reflective stillness)',
    food: 'Chamomile, peppermint, or ashwagandha herbal infusions.',
    bonusTip: 'Write down 1 major question before sleep; note the first thoughts upon waking.',
  },
  8: {
    number: 8,
    title: 'Power & Manifestation',
    keyword: 'Abundance',
    powerColor: {
      name: 'Black, Gold, or Dark Green',
      description: 'Projects strength, executive focus, and sovereign wealth energy.',
    },
    microRitual: {
      title: 'Conscious Financial Audit',
      whatToDo: 'Spend 5 dedicated minutes inspecting your recent income and outflows.',
      howToDoIt: 'Open your bank account without judgment or anxiety. Identify one leak or growth point.',
      whyItWorks: 'Directs respectful, focused attention to material resources.',
      whatToExp: 'Sovereign command over money and reduction of scarcity anxiety.',
    },
    affirmation: 'Abundance flows to me with ease. I am worthy of success and prosperity. My achievements are meaningful and lasting.',
    gemstone: {
      primary: 'Blue Sapphire',
      alternative: "Tiger's Eye",
      ritual: 'Wear a tiger’s eye bracelet on your dominant wrist to shield confidence.',
    },
    luckyDay: 'Saturday Afternoon (Material realization)',
    food: 'High-cacao dark chocolate (70%+), consumed with deliberate focus.',
    bonusTip: 'Dress one level above usual today to signal self-worth and authority.',
  },
  9: {
    number: 9,
    title: 'Universal Compassion & Completion',
    keyword: 'Release',
    powerColor: {
      name: 'Red, Gold, or Rose',
      description: 'Supports root grounding while holding high humanitarian frequencies.',
    },
    microRitual: {
      title: 'Release & Forgiveness Letter',
      whatToDo: 'Write an uncensored letter acknowledging an old emotional debt, then discard it.',
      howToDoIt: 'Write the grievance fully on paper, write "I release you to your journey," and shred or burn it safely.',
      whyItWorks: 'Cuts energetic cords, freeing trapped mental bandwidth.',
      whatToExp: 'Lightness in the chest and renewed optimism.',
    },
    affirmation: 'I release what no longer serves me. I complete cycles with grace and make space for new blessings.',
    gemstone: {
      primary: 'Ruby',
      alternative: 'Red Jasper',
      ritual: 'Hold red jasper to stay anchored while releasing old attachments.',
    },
    luckyDay: 'Sunday Evening (Cycle completion)',
    food: 'Pomegranates, red apples, cranberries, strawberries.',
    bonusTip: 'Offer a genuine smile or compliment to a stranger today.',
  },
};