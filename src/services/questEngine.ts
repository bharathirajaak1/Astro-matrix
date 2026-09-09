import { EXPANDED_REMEDIES, ElaboratedRemedy } from '../data/expandedRemedies';

// Priority Hierarchy: 1 -> 3 -> 4 -> 8 -> 7 -> 6 -> 2 -> 5 -> 9
export const HEALING_PRIORITY_ORDER = [1, 3, 4, 8, 7, 6, 2, 5, 9];

export interface QuestStatus {
  activeNumber: number;
  activeRemedy: ElaboratedRemedy;
  upcomingNumbers: number[];
  healedNumbers: number[];
  overallProgress: number; // 0 to 100
}

export interface DailyRitualPack {
  morning: { title: string; text: string; number: number };
  midday: { title: string; text: string; number: number };
  evening: { title: string; text: string; number: number };
}

export function computeQuestHierarchy(
  missingNumbers: number[],
  completedNumbers: number[] = []
): QuestStatus {
  const remainingMissing = missingNumbers.filter((n) => !completedNumbers.includes(n));
  
  // Highest priority missing number
  const sortedRemaining = HEALING_PRIORITY_ORDER.filter((n) => remainingMissing.includes(n));
  const activeNumber = sortedRemaining.length > 0 ? sortedRemaining[0] : 0;
  const upcomingNumbers = sortedRemaining.slice(1);

  const total = missingNumbers.length;
  const progress = total === 0 ? 100 : Math.round((completedNumbers.length / total) * 100);

  return {
    activeNumber,
    activeRemedy: EXPANDED_REMEDIES[activeNumber] || EXPANDED_REMEDIES[3],
    upcomingNumbers,
    healedNumbers: completedNumbers,
    overallProgress: progress,
  };
}

export function generateDailyRitualPack(
  missingNumbers: number[],
  completedNumbers: number[] = []
): DailyRitualPack {
  const status = computeQuestHierarchy(missingNumbers, completedNumbers);
  const primary = status.activeRemedy;
  const secondaryNumber = status.upcomingNumbers[0] || 4; // defaults to Number 4 structure
  const secondary = EXPANDED_REMEDIES[secondaryNumber] || primary;

  return {
    morning: {
      title: `Morning Activation (${primary.title})`,
      text: `Power Color: ${primary.powerColor.name}\n\nStart your day intentionally. As you dress, choose a ${primary.powerColor.name.toLowerCase()} accessory or item. ${primary.powerColor.description}`,
      number: primary.number,
    },
    midday: {
      title: `Midday Mini-Ritual: ${primary.microRitual.title}`,
      text: `At lunchtime, practice ${primary.microRitual.title}. ${primary.microRitual.whatToDo} — ${primary.microRitual.howToDoIt}`,
      number: primary.number,
    },
    evening: {
      title: `Evening Wind-Down (${secondary.title})`,
      text: `Grounding Reflection\n\nBefore you sleep, take 2 minutes to reflect: What went well today? What did you learn? Write one sentence in your journal about today's journey. Then, set your intention for tomorrow: "I will greet the day with purpose." This quiet reflection builds the Number ${secondary.number} energy of structure and discipline, preparing your mind for rest and renewal.`,
      number: secondary.number,
    },
  };
}