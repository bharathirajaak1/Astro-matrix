// Time-of-day contextual greeting
export const getTimeOfDayGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  const firstName = name ? name.trim().split(' ')[0] : 'there';

  if (hour >= 5 && hour < 12) return `Good Morning, ${firstName} ☀️`;
  if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName} 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening, ${firstName} 🌇`;
  return `Good Night, ${firstName} 🌙`;
};

// Trait dictionaries for Numbers screen synthesis
interface NumberTrait {
  verb: string;
  trait: string;
}

const NUMBER_TRAITS: Record<number, NumberTrait> = {
  1: { verb: 'lead', trait: 'courage and vision' },
  2: { verb: 'harmonize', trait: 'empathy and diplomacy' },
  3: { verb: 'create', trait: 'expressive optimism' },
  4: { verb: 'build', trait: 'discipline and grounded focus' },
  5: { verb: 'adapt', trait: 'fearless adaptability' },
  6: { verb: 'nurture', trait: 'devotion and responsibility' },
  7: { verb: 'analyze', trait: 'deep intuition and truth' },
  8: { verb: 'execute', trait: 'resilient ambition' },
  9: { verb: 'inspire', trait: 'compassionate wisdom' },
  11: { verb: 'illuminate', trait: 'master spiritual vision' },
  22: { verb: 'manifest', trait: 'grand architectural mastery' },
  33: { verb: 'uplift', trait: 'universal selfless devotion' },
};

export const generateNumbersSummary = (
  lifePath: number,
  secondNumber: number,
  secondLabel: 'Soul Urge' | 'Destiny' = 'Soul Urge'
): string => {
  const lp = NUMBER_TRAITS[lifePath] || { verb: 'walk', trait: 'unique purpose' };

  if (lifePath === secondNumber) {
    return `Your path is deeply aligned: you ${lp.verb} with ${lp.trait} through both your Life Path (${lifePath}) and ${secondLabel} (${secondNumber}).`;
  }

  const sec = NUMBER_TRAITS[secondNumber] || { verb: 'radiate', trait: 'authentic power' };
  return `You ${lp.verb} with ${lp.trait} (Life Path ${lifePath}) and ${sec.verb} with ${sec.trait} (${secondLabel} ${secondNumber}).`;
};

// Lo Shu Grid Plane mapping
interface PlaneDefinition {
  name: string;
  numbers: number[];
  strengthText: string;
}

const LO_SHU_PLANES: PlaneDefinition[] = [
  { name: 'Willpower Plane', numbers: [9, 5, 1], strengthText: 'exceptional willpower' },
  { name: 'Thought Plane', numbers: [4, 9, 2], strengthText: 'razor-sharp intellect and strategy' },
  { name: 'Action Plane', numbers: [8, 1, 6], strengthText: 'dynamic physical execution' },
  { name: 'Emotional Plane', numbers: [3, 5, 7], strengthText: 'deep emotional resilience' },
  { name: 'Planning Plane', numbers: [4, 3, 8], strengthText: 'visionary long-term foresight' },
  { name: 'Practical Plane', numbers: [2, 7, 6], strengthText: 'tangible grounding and manifestation' },
];

const MISSING_GROWTH_AREAS: Record<number, string> = {
  1: 'assertive self-direction',
  2: 'cooperative intuition and patience',
  3: 'confident creative self-expression',
  4: 'financial order and systematic discipline',
  5: 'emotional flexibility and adaptability',
  6: 'home harmony and domestic balance',
  7: 'introspective trust and spiritual depth',
  8: 'material discernment and perseverance',
  9: 'humanitarian compassion and completion',
};

export const generateLoShuSummary = (dob: string): string => {
  const digits = (dob || '').replace(/\D/g, '').split('').map(Number);
  const digitCounts = digits.reduce<Record<number, number>>((acc, num) => {
    if (num >= 1 && num <= 9) acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, {});

  // 1. Determine most active plane
  let bestPlane = LO_SHU_PLANES[0];
  let maxMatches = -1;

  for (const plane of LO_SHU_PLANES) {
    const presentCount = plane.numbers.filter((n) => (digitCounts[n] || 0) > 0).length;
    if (presentCount > maxMatches) {
      maxMatches = presentCount;
      bestPlane = plane;
    }
  }

  // 2. Identify all missing numbers and primary growth focus
  const allMissing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !digitCounts[n]);
  const missingLabel = allMissing.join(', ');

  const priorityOrder = [4, 3, 2, 5, 7, 8, 1, 6, 9];
  const primaryMissing = priorityOrder.find((n) => !digitCounts[n]) || 4;
  const growthArea = MISSING_GROWTH_AREAS[primaryMissing] || 'inner balance';
  const planeNumbersLabel = bestPlane.numbers.join('-');

if (maxMatches === 3) {
    return `Your grid shows ${bestPlane.strengthText} (${planeNumbersLabel} active), with an opportunity to build ${growthArea} (Missing ${missingLabel}).`;
  }

  return `Your grid channels ${bestPlane.strengthText} (${planeNumbersLabel} partially active), with a key path to cultivate ${growthArea} (Missing ${missingLabel}).`;
};