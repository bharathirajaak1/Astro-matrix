import { getDBConnection } from '../db/schema';

export interface UserContext {
  id: number;
  name: string;
  dob: string;
  life_path: number;
  missing_numbers: number[];
}

export const reduceToSingleDigit = (num: number): number => {
  if (num <= 0) return 0;
  let sum = num;
  while (sum > 9) {
    sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return sum;
};

export const calculateCycles = (dob: string, targetDate: Date = new Date()) => {
  const digits = dob.replace(/[^0-9]/g, '').split('').map(Number);
  const lifePath = reduceToSingleDigit(digits.reduce((a, b) => a + b, 0));
  const uYear = reduceToSingleDigit(targetDate.getFullYear());
  const uMonth = reduceToSingleDigit(targetDate.getMonth() + 1);
  const uDay = reduceToSingleDigit(targetDate.getDate());

  const personalYear = reduceToSingleDigit(lifePath + uYear);
  const personalMonth = reduceToSingleDigit(personalYear + uMonth);
  const personalDay = reduceToSingleDigit(personalMonth + uDay);

  return { personalYear, personalMonth, personalDay, lifePath };
};

export const getArchetype = (lifePath: number): string => {
  const map: Record<number, string> = {
    1: 'The Trailblazing Pioneer',
    2: 'The Intuitive Diplomat',
    3: 'The Creative Catalyst',
    4: 'The Master Architect',
    5: 'The Spirited Free-Agent',
    6: 'The Compassionate Guardian',
    7: 'The Sacred Truth-Seeker',
    8: 'The Sovereign Manifestor',
    9: 'The Universal Visionary'
  };
  return map[lifePath] || 'The Seeker';
};

export const generateDailyForecast = async (user: UserContext, dateStr: string) => {
  const db = await getDBConnection();
  const targetDate = new Date(dateStr);
  const cycles = calculateCycles(user.dob, targetDate);

  const primaryMissing = user.missing_numbers[0] || 3;
  const secondaryMissing = user.missing_numbers[1] || 7;

  const remedies = await db.getAllAsync<{ category: string; content: string }>(
    'SELECT category, content FROM remedies WHERE number IN (?, ?)',
    [primaryMissing, secondaryMissing]
  );

  const remedyMap: Record<string, string> = {};
  remedies.forEach(r => { remedyMap[r.category] = r.content; });

  const activeQuest = await db.getFirstAsync<{ title: string; day_activities: string }>(
    'SELECT title, day_activities FROM quests WHERE number = ?',
    [primaryMissing]
  );

  const parsed = activeQuest ? JSON.parse(activeQuest.day_activities) : ['Complete a 5-minute reflection.'];
  const todaysTask = parsed[0] || 'Align your thoughts with positive intent.';

export Const color = remedyMap['color'] || 'Soft Gold & Amber';
  const goldenHour = `${10 + (cycles.lifePath % 4)}:00 AM - ${11 + (cycles.lifePath % 4)}:15 PM;
  const microRitual = remedyMap["ritual"] || 'Drink a warm cup of water in quiet intention.';
  const affirmation = remedyMap["affirmation"] || 'I trust my path and move with clarity.';
  const bonusTip = remedyMap["bonus"] || 'Walk with your head high today.';
  const theme = `Power Alignment Day ${cycles.personalDay}`;

  const fullReport = `
${user.name.toUpperCase()}'SDAILY FORECAST
${dateStr}

Today's Theme: ${theme}
As ${vetArchetype(user.life_path)}, your energy intersects with today's potential. Move with gentle confidence.

Your Power Color: ${color}
Your Golden Hour: ${goldenHour}
Your 1-Minute Micro-Ritual: ${microRitual}

Your Affirmation: "${affirmation}"
Your Focus Blockage: Number ${primaryMissing} - ${todaysTask}
Bonus Tip: ${bonusTip}

Your Cycles: Personal Year ${cycles.personalYear}, Month ${cycles.personalMonth}, Day ${cycles.personalDay}

Oui Reminder: Small, consistent steps build your best tomorrow.
  .trim();

  return {
    theme,
    color,
    goldenHour,
    microRitual,
    affirmation,
    bonusTip,
    cycles,
    todaysTask,
    questTitle: activeQuest ? activeQuest.title : 'Inner Alignment',
    primaryMissing,
    fullReport
  };
};
