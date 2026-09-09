import { buildLoShuGrid } from '../core/loShu';
import { personalNumbers } from '../core/forecast';
import { getDBConnection } from '../db/schema';

export function getArchetype(lifePath: number): string {
  const archetypes: Record<number, string> = {
    1: 'The Pioneer',
    2: 'The Diplomat',
    3: 'The Creative Communicator',
    4: 'The Practical Builder',
    5: 'The Freedom Seeker',
    6: 'The Nurturing Guide',
    7: 'The Introspective Sage',
    8: 'The Sovereign Achiever',
    9: 'The Global Philanthropist',
    11: 'The Illuminator',
    22: 'The Master Builder',
    33: 'The Master Healer',
  };
  return archetypes[lifePath] || 'The Seeker';
}

export async function generateDailyForecast(
  user: { name: string; dob: string; life_path: number; destiny: number },
  targetDate: Date = new Date()
) {
  const db = await getDBConnection();
  const dateStr = targetDate.toISOString().split('T')[0];

  const grid = buildLoShuGrid(user.dob);
  const missing = grid.missing;
  const primaryMissing = missing.length > 0 ? (missing[0] as number) : 4;

  const remedies = await db.getAllAsync<{ category: string; content: string }>(
    'SELECT category, content FROM remedies WHERE number = ?',
    [primaryMissing]
  );
  const remedyMap: Record<string, string> = {};
  if (Array.isArray(remedies)) {
    remedies.forEach(r => {
      remedyMap[r.category] = r.content;
    });
  }

  const quest = await db.getFirstAsync<any>(
    'SELECT * FROM quests WHERE number = ?',
    [primaryMissing]
  );

  let todaysTask = 'Organize one small drawer or shelf';
  if (quest && quest.day_activities) {
    try {
      const activities = JSON.parse(quest.day_activities);
      if (Array.isArray(activities) && activities.length > 0) {
        todaysTask = activities[0];
      }
    } catch (_) {}
  }

  const cycles = personalNumbers(user.dob, dateStr);

  const goldenHour =
    user.life_path % 2 === 0
      ? '10:00 AM - 11:30 AM'
      : '02:00 PM - 03:30 PM';

  const color = remedyMap['color'] || 'Soft Gold & Amber';
  const microRitual = remedyMap['ritual'] || 'Organize a single drawer';
  const affirmation =
    remedyMap['affirmation'] ||
    'I step forward today with clarity, grounding, and steady purpose.';
  const bonusTip = remedyMap['bonus'] || 'Drink water before starting tasks';

  const theme = 'Power Alignment Day ' + cycles.personalDay;

  const fullReport =
    user.name.toUpperCase() + "'S DAILY FORECAST\n" +
    dateStr + '\n\n' +
    "Today's Theme: " + theme + '\n' +
    'As ' + getArchetype(user.life_path) + ', your energy intersects with today’s potential. Move with gentle confidence.\n\n' +
    'Your Power Color: ' + color + '\n' +
    'Your Golden Hour: ' + goldenHour + '\n' +
    'Your 1-Minute Micro-Ritual: ' + microRitual + '\n' +
    'Your Affirmation: "' + affirmation + '"\n' +
    'Your Focus Blockage: Number ' + primaryMissing + ' - ' + todaysTask + '\n' +
    'Bonus Tip: ' + bonusTip + '\n\n' +
    'Your Cycles: Personal Year ' + cycles.personalYear + ', Month ' + cycles.personalMonth + ', Day ' + cycles.personalDay + '\n\n' +
    'Our Reminder: Small, consistent steps build your best tomorrow.';

  return {
    date: dateStr,
    theme,
    color,
    goldenHour,
    microRitual,
    affirmation,
    primaryMissing,
    todaysTask,
    questTitle: quest?.title || 'Build Your Foundation',
    personalYear: cycles.personalYear,
    personalMonth: cycles.personalMonth,
    personalDay: cycles.personalDay,
    fullReport,
  };
}
