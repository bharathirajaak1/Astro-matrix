import { buildLoShuGrid } from './loShu';
import { getAllExpressionPlanePresence, type ExpressionPlaneId } from './expressionPlanes';
import type { Digit } from './types';

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

// Lo Shu Grid Plane strength wording, keyed by the canonical Expression
// Plane id (src/core/expressionPlanes.ts) - content only, not a second
// Plane/numbers definition. Order mirrors the previous local plane list
// exactly: ties in presence count are broken by first match in this order,
// so changing it would change which plane wins a tie.
const PLANE_PRIORITY_ORDER: ExpressionPlaneId[] = [
  'drivePersistence',
  'mindLogic',
  'actionGrounding',
  'heartIntuition',
  'visionPlanning',
  'manifestation',
];

const PLANE_STRENGTH_TEXT: Record<ExpressionPlaneId, string> = {
  drivePersistence: 'exceptional willpower',
  mindLogic: 'razor-sharp intellect and strategy',
  actionGrounding: 'dynamic physical execution',
  heartIntuition: 'deep emotional resilience',
  visionPlanning: 'visionary long-term foresight',
  manifestation: 'tangible grounding and manifestation',
};

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

const EMPTY_DIGIT_COUNTS: Record<Digit, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

export const generateLoShuSummary = (dob: string): string => {
  const digitCounts: Record<Digit, number> = dob ? buildLoShuGrid(dob).counts : EMPTY_DIGIT_COUNTS;

  // 1. Determine most active plane - presence/count now comes from the
  // canonical Expression Plane model (src/core/expressionPlanes.ts) rather
  // than a locally duplicated numbers array. Tie-breaking (first plane to
  // reach the current max) is preserved via PLANE_PRIORITY_ORDER above.
  const presenceById = new Map(
    getAllExpressionPlanePresence(digitCounts).map((presence) => [presence.plane.id, presence] as const),
  );

  let bestPlaneId = PLANE_PRIORITY_ORDER[0];
  let maxMatches = -1;

  for (const id of PLANE_PRIORITY_ORDER) {
    const presentCount = presenceById.get(id)!.presentCount;
    if (presentCount > maxMatches) {
      maxMatches = presentCount;
      bestPlaneId = id;
    }
  }

  const bestPlaneStrengthText = PLANE_STRENGTH_TEXT[bestPlaneId];

  // 2. Identify primary growth focus
  const priorityOrder: Digit[] = [4, 3, 2, 5, 7, 8, 1, 6, 9];
  const primaryMissing = priorityOrder.find((n) => !digitCounts[n]) || 4;
  const growthArea = MISSING_GROWTH_AREAS[primaryMissing] || 'inner balance';

if (maxMatches === 3) {
    return `In numerology, your birth-date pattern is traditionally associated with ${bestPlaneStrengthText} — one of your strongest patterns. It may also be worth balancing that with ${growthArea}.`;
  }

  return `In numerology, your birth-date pattern is traditionally associated with ${bestPlaneStrengthText}. It may be worth developing ${growthArea} as a complementary area of growth.`;
};