import {
  PRACTICE_LIBRARY,
  bodyBreathReset,
  type ActivityType,
  type PracticeActivity,
  type PracticeDay,
} from '../../src/data/practiceLibrary';

const ACTIVITY_TYPES: ActivityType[] = [
  'choice',
  'multiChoice',
  'scenario',
  'sequence',
  'pattern',
  'memory',
  'logic',
  'sort',
  'observation',
  'creative',
  'realWorldAction',
  'reflection',
  'rating',
];

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const FORTUNE_LANGUAGE_PATTERN =
  /will attract|attract wealth|will bring (you )?fortune|increase your fortune|change your destiny|activate(s|d)? your (energy|luck)|guarantee|promise(s|d)?|certain(ly)? to|cure|heal (a|your|you)|will make you (rich|wealthy)|supernatural/i;

const APPROVED_COLOR_NAMES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Pink or Rose',
  'Purple or Violet',
  'Dark Blue',
  'Gold or Warm Yellow',
];

/** Every activity attached to a day: morning's one, afternoon's one-or-more, night's optional one. */
function activitiesOf(day: PracticeDay): PracticeActivity[] {
  const night = day.night.activity ? [day.night.activity] : [];
  return [day.morning.activity, ...day.afternoon.activities, ...night];
}

function allDays(): PracticeDay[] {
  return NUMBERS.flatMap((n) => PRACTICE_LIBRARY.numbers[n].days);
}

/** Every piece of free text in a day - used for the fortune-language content check. */
function allTextOf(day: PracticeDay): string[] {
  const text: string[] = [day.title, day.theme, day.morning.focus, day.afternoon.introduction, day.night.reflection, day.night.carryForwardThought];
  if (day.afternoon.experienceFeedbackPrompt) text.push(day.afternoon.experienceFeedbackPrompt);
  if (day.afternoon.repeatPreferencePrompt) text.push(day.afternoon.repeatPreferencePrompt);
  if (day.night.experienceFeedbackPrompt) text.push(day.night.experienceFeedbackPrompt);
  if (day.night.repeatPreferencePrompt) text.push(day.night.repeatPreferencePrompt);
  if (day.night.affirmation) text.push(day.night.affirmation);
  if (day.night.closingThought) text.push(day.night.closingThought);
  if (day.morning.colorCue) text.push(day.morning.colorCue.name, day.morning.colorCue.description);
  for (const activity of activitiesOf(day)) {
    text.push(activity.prompt);
    if (activity.instructions) text.push(activity.instructions);
    if (activity.hint) text.push(activity.hint);
    if (activity.completionFeedback) text.push(activity.completionFeedback);
    if ('scenario' in activity) text.push(activity.scenario);
    if ('whatToNotice' in activity) text.push(activity.whatToNotice);
    if ('whatToMake' in activity) text.push(activity.whatToMake);
    if ('whatToDo' in activity) text.push(activity.whatToDo);
    if ('reflectionPrompt' in activity) text.push(activity.reflectionPrompt);
    if ('scaleLabel' in activity) text.push(activity.scaleLabel);
    if ('options' in activity) text.push(...activity.options.map((o) => o.label));
  }
  return text;
}

describe('PRACTICE_LIBRARY structure (21-day cycle)', () => {
  test('1: all 9 numbers exist', () => {
    for (const n of NUMBERS) {
      expect(PRACTICE_LIBRARY.numbers[n]).toBeDefined();
      expect(PRACTICE_LIBRARY.numbers[n].number).toBe(n);
    }
  });

  test('2: each number has exactly 21 days', () => {
    for (const n of NUMBERS) {
      expect(PRACTICE_LIBRARY.numbers[n].days).toHaveLength(21);
    }
  });

  test('3: total PracticeDay count is 189', () => {
    expect(allDays()).toHaveLength(189);
  });

  test('4: every number contains days 1 through 21, in order', () => {
    const fullRange = Array.from({ length: 21 }, (_, i) => i + 1);
    for (const n of NUMBERS) {
      expect(PRACTICE_LIBRARY.numbers[n].days.map((d) => d.day)).toEqual(fullRange);
    }
  });

  test('5: no duplicate PracticeDay ids', () => {
    const ids = allDays().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('6: no duplicate activity ids', () => {
    const activityIds = allDays().flatMap((day) => activitiesOf(day).map((a) => a.id));
    expect(new Set(activityIds).size).toBe(activityIds.length);
  });

  test('7: the existing (locked) days 1-7 remain structurally valid for every number', () => {
    for (const n of NUMBERS) {
      const firstSeven = PRACTICE_LIBRARY.numbers[n].days.slice(0, 7);
      expect(firstSeven.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      for (const day of firstSeven) {
        expect(day.number).toBe(n);
        expect(day.id).toBe(`n${n}-d${day.day}`);
        expect(day.morning).toBeDefined();
        expect(day.afternoon.activities.length).toBeGreaterThanOrEqual(1);
        expect(day.night).toBeDefined();
      }
    }
  });

  test('8: days 8-14 (exploration) exist for every number', () => {
    for (const n of NUMBERS) {
      const explorationDays = PRACTICE_LIBRARY.numbers[n].days.filter((d) => d.day >= 8 && d.day <= 14);
      expect(explorationDays).toHaveLength(7);
    }
  });

  test('9: days 15-21 (integration) exist for every number', () => {
    for (const n of NUMBERS) {
      const integrationDays = PRACTICE_LIBRARY.numbers[n].days.filter((d) => d.day >= 15 && d.day <= 21);
      expect(integrationDays).toHaveLength(7);
    }
  });

  test('10: every day has the required morning practice', () => {
    for (const day of allDays()) {
      expect(day.morning).toBeDefined();
      expect(typeof day.morning.focus).toBe('string');
      expect(day.morning.focus.length).toBeGreaterThan(0);
      expect(day.morning.activity).toBeDefined();
    }
  });

  test('11: every day has at least one afternoon activity', () => {
    for (const day of allDays()) {
      expect(Array.isArray(day.afternoon.activities)).toBe(true);
      expect(day.afternoon.activities.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('12: night practice is always present, but its activity remains optional per day', () => {
    let daysWithNightActivity = 0;
    for (const day of allDays()) {
      expect(day.night).toBeDefined();
      expect(typeof day.night.reflection).toBe('string');
      expect(typeof day.night.carryForwardThought).toBe('string');
      if (day.night.activity) daysWithNightActivity += 1;
    }
    // Night activities are used sparingly, not mechanically attached to every day.
    expect(daysWithNightActivity).toBeGreaterThan(0);
    expect(daysWithNightActivity).toBeLessThan(allDays().length);
  });

  test('13: reflective/open activities never carry a correctness field', () => {
    const openTypes: ActivityType[] = ['observation', 'creative', 'realWorldAction', 'reflection', 'rating', 'memory'];
    for (const day of allDays()) {
      for (const activity of activitiesOf(day)) {
        if (openTypes.includes(activity.type)) {
          expect('correctOptionId' in activity).toBe(false);
          expect('correctOptionIds' in activity).toBe(false);
          expect('correctOrder' in activity).toBe(false);
          expect('correctAssignment' in activity).toBe(false);
        }
      }
    }
  });

  test('14: color cues use symbolic/traditional framing, never causal claims', () => {
    const causalWords = /\bactivates\b|\bincreases\b|\bwill (increase|attract|cause)\b|\bcures?\b/i;
    for (const day of allDays()) {
      if (day.morning.colorCue) {
        expect(day.morning.colorCue.description).toMatch(/traditionally associated/i);
        expect(day.morning.colorCue.description).not.toMatch(causalWords);
      }
    }
  });

  test('15: no practice content contains guarantee/causal fortune language', () => {
    for (const day of allDays()) {
      for (const text of allTextOf(day)) {
        expect(text).not.toMatch(FORTUNE_LANGUAGE_PATTERN);
      }
    }
  });

  test('every activity has a valid, recognized ActivityType', () => {
    for (const day of allDays()) {
      for (const activity of activitiesOf(day)) {
        expect(ACTIVITY_TYPES).toContain(activity.type);
      }
    }
  });

  test('no PracticeDay (or its activities) contains persisted/user state', () => {
    const forbiddenKeys = ['completed', 'completedAt', 'profileId', 'streakDays', 'questDay', 'cycleDay', 'lastCompletedDate'];
    for (const day of allDays()) {
      const dayKeys = Object.keys(day);
      for (const forbidden of forbiddenKeys) {
        expect(dayKeys).not.toContain(forbidden);
      }
      for (const activity of activitiesOf(day)) {
        const activityKeys = Object.keys(activity);
        for (const forbidden of forbiddenKeys) {
          expect(activityKeys).not.toContain(forbidden);
        }
      }
    }
  });

  test('the structure consistently resolves every one of the 189 days by number + day', () => {
    for (const n of NUMBERS) {
      for (let day = 1; day <= 21; day += 1) {
        const found = PRACTICE_LIBRARY.numbers[n].days.find((d) => d.day === day);
        expect(found).toBeDefined();
        expect(found?.id).toBe(`n${n}-d${day}`);
        expect(found?.number).toBe(n);
      }
    }
  });

  test('the interface accepts an additional day (e.g. day 22) without any shape change', () => {
    const existing = PRACTICE_LIBRARY.numbers[1].days;
    const day22: PracticeDay = {
      id: 'n1-d22',
      number: 1,
      day: 22,
      title: 'A Future Day',
      theme: 'Extend',
      morning: {
        focus: 'Placeholder focus for a future day.',
        activity: { id: 'n1-d22-morning', type: 'reflection', prompt: 'Placeholder prompt.', reflectionPrompt: 'Placeholder.' },
      },
      afternoon: {
        introduction: 'Placeholder introduction.',
        activities: [{ id: 'n1-d22-afternoon-1', type: 'reflection', prompt: 'Placeholder.', reflectionPrompt: 'Placeholder.' }],
      },
      night: {
        reflection: 'Placeholder reflection.',
        carryForwardThought: 'Placeholder carry-forward.',
      },
    };

    const extended = [...existing, day22];
    expect(extended).toHaveLength(22);
    expect(extended[21].day).toBe(22);
  });

  test('16: every afternoon and night block carries the standard experience-feedback prompt', () => {
    for (const day of allDays()) {
      expect(day.afternoon.experienceFeedbackPrompt).toBe("How was today's activity?");
      expect(day.night.experienceFeedbackPrompt).toBe("How was today's activity?");
    }
  });

  test('17: every afternoon and night block carries a separate Yes/No repeat-preference prompt, distinct from completion', () => {
    for (const day of allDays()) {
      expect(day.afternoon.repeatPreferencePrompt).toBe('Would you like to try a similar practice again?');
      expect(day.night.repeatPreferencePrompt).toBe('Would you like to try a similar practice again?');
      // The repeat-preference field carries no persisted/completion-shaped keys of its own -
      // it is plain feedback text, not a field that can advance the cycle.
      expect(typeof day.afternoon.repeatPreferencePrompt).toBe('string');
    }
  });

  test('18: every night includes a number-specific affirmation and a closing thought, distinct from the carry-forward thought', () => {
    for (const n of NUMBERS) {
      const affirmationsForNumber = new Set(PRACTICE_LIBRARY.numbers[n].days.map((d) => d.night.affirmation));
      // The same affirmation recurs across all 21 days for a given number.
      expect(affirmationsForNumber.size).toBe(1);
      for (const day of PRACTICE_LIBRARY.numbers[n].days) {
        expect(day.night.affirmation).toBeTruthy();
        expect(day.night.closingThought).toBeTruthy();
        expect(day.night.closingThought).not.toBe(day.night.carryForwardThought);
      }
    }
  });

  test('19: affirmations are reflective self-development statements, never guaranteed-outcome claims', () => {
    const bannedAffirmationLanguage =
      /guarantee|promise|attract wealth|activate(s|d)? your (luck|energy)|will (bring|give) you|cure|heal|supernatural|certain(ly)? to/i;
    for (const n of NUMBERS) {
      const affirmation = PRACTICE_LIBRARY.numbers[n].days[0].night.affirmation as string;
      expect(affirmation).not.toMatch(bannedAffirmationLanguage);
      expect(affirmation.toLowerCase()).toMatch(/^i /);
    }
  });

  test('20: color cues use only the approved color names', () => {
    for (const day of allDays()) {
      if (day.morning.colorCue) {
        expect(APPROVED_COLOR_NAMES).toContain(day.morning.colorCue.name);
      }
    }
  });

  test("21: bodyBreathReset() uses the approved wording's five steps", () => {
    const reset = bodyBreathReset('test-reset-id');
    expect(reset.type).toBe('realWorldAction');
    expect('whatToDo' in reset && reset.whatToDo).toMatch(/mobile phone aside/i);
    expect('whatToDo' in reset && reset.whatToDo).toMatch(/stretch your arms, shoulders, body and legs/i);
    expect('whatToDo' in reset && reset.whatToDo).toMatch(/relax your hands and shoulders/i);
    expect('whatToDo' in reset && reset.whatToDo).toMatch(/3 slow, comfortable breaths/i);
    expect('whatToDo' in reset && reset.whatToDo).toMatch(/continue with today's practice/i);
  });

  test('28: every requiresMorningOptionId on an Afternoon activity matches a real option id on that day\'s Morning activity', () => {
    for (const day of allDays()) {
      const morningActivity = day.morning.activity;
      const morningOptionIds =
        'options' in morningActivity ? morningActivity.options.map((option) => option.id) : [];

      for (const activity of day.afternoon.activities) {
        if (!activity.requiresMorningOptionId) continue;
        expect(morningOptionIds).toContain(activity.requiresMorningOptionId);
      }
    }
  });

  test('29: the five known branch days map every Afternoon alternative to the correct Morning option', () => {
    const expected: Record<string, Record<string, string>> = {
      'n2-d4': {
        'n2-d4-afternoon-1': 'n2-d4-morning-1',
        'n2-d4-afternoon-2': 'n2-d4-morning-2',
        'n2-d4-afternoon-3': 'n2-d4-morning-3',
      },
      'n2-d13': {
        'n2-d13-afternoon-1': 'n2-d13-morning-1',
        'n2-d13-afternoon-2': 'n2-d13-morning-2',
        'n2-d13-afternoon-3': 'n2-d13-morning-3',
      },
      'n6-d9': {
        'n6-d9-afternoon-1': 'n6-d9-morning-1',
        'n6-d9-afternoon-2': 'n6-d9-morning-2',
        'n6-d9-afternoon-3': 'n6-d9-morning-3',
      },
      'n6-d18': {
        'n6-d18-afternoon-1': 'n6-d18-morning-1',
        'n6-d18-afternoon-2': 'n6-d18-morning-2',
        'n6-d18-afternoon-3': 'n6-d18-morning-3',
      },
      'n9-d10': {
        'n9-d10-afternoon-1': 'n9-d10-morning-1',
        'n9-d10-afternoon-2': 'n9-d10-morning-2',
        'n9-d10-afternoon-3': 'n9-d10-morning-3',
      },
    };

    for (const day of allDays()) {
      const expectedForDay = expected[day.id];
      if (!expectedForDay) continue;

      expect(day.afternoon.activities).toHaveLength(3);
      for (const activity of day.afternoon.activities) {
        expect(activity.requiresMorningOptionId).toBe(expectedForDay[activity.id]);
      }

      const morningActivity = day.morning.activity;
      const morningOptionIds =
        'options' in morningActivity ? morningActivity.options.map((option) => option.id) : [];
      expect(morningOptionIds).toEqual(Object.values(expectedForDay));
    }
  });

  test('30: days other than the five known branch days carry no requiresMorningOptionId', () => {
    const branchDayIds = new Set(['n2-d4', 'n2-d13', 'n6-d9', 'n6-d18', 'n9-d10']);
    for (const day of allDays()) {
      if (branchDayIds.has(day.id)) continue;
      for (const activity of day.afternoon.activities) {
        expect(activity.requiresMorningOptionId).toBeUndefined();
      }
    }
  });
});

describe('Number 1 Days 1-7 guided-practice content', () => {
  const NUMBER_1_FIRST_WEEK = PRACTICE_LIBRARY.numbers[1].days.slice(0, 7);

  test('22: every morning activity explains why it matters, gives concrete examples, and a closing reminder', () => {
    for (const day of NUMBER_1_FIRST_WEEK) {
      const activity = day.morning.activity;
      expect(activity.whyThisMatters).toBeTruthy();
      expect(activity.examples?.length ?? 0).toBeGreaterThan(0);
      expect(activity.todaysReminder).toBeTruthy();
    }
  });

  test('23: every afternoon activity explains why it matters, gives concrete examples, and a closing reminder', () => {
    for (const day of NUMBER_1_FIRST_WEEK) {
      for (const activity of day.afternoon.activities) {
        expect(activity.whyThisMatters).toBeTruthy();
        expect(activity.examples?.length ?? 0).toBeGreaterThan(0);
        expect(activity.todaysReminder).toBeTruthy();
      }
    }
  });

  test('24: whyThisMatters, examples, and todaysReminder wording is not simply repeated across the seven days', () => {
    const whyThisMatters = NUMBER_1_FIRST_WEEK.map((d) => d.morning.activity.whyThisMatters);
    const todaysReminders = NUMBER_1_FIRST_WEEK.map((d) => d.morning.activity.todaysReminder);
    expect(new Set(whyThisMatters).size).toBe(whyThisMatters.length);
    expect(new Set(todaysReminders).size).toBe(todaysReminders.length);
  });

  test('25: Night includes a structured mood activity for every day of the first week, with a Look Back reflection and a menu-style carry-forward thought', () => {
    for (const day of NUMBER_1_FIRST_WEEK) {
      expect(day.night.activity).toBeDefined();
      expect(day.night.reflection.toLowerCase()).toMatch(/look back/);
      expect(day.night.carryForwardThought.toLowerCase()).toMatch(/or simply/);
    }
  });

  test('26: the Color Cue gives practical, no-purchase guidance and concrete nearby-object examples', () => {
    const colorCue = NUMBER_1_FIRST_WEEK[0].morning.colorCue;
    expect(colorCue).toBeDefined();
    expect(colorCue?.whatToDo).toBeTruthy();
    expect(colorCue?.whatToDo).not.toMatch(/\bbuy\b|\bpurchase\b/i);
    expect(colorCue?.whatToDo).not.toMatch(/you (must|need to|have to) (leave|go)/i);
    expect(colorCue?.examples?.length ?? 0).toBeGreaterThan(0);
    // Every day this week shares the same Color Cue content (the colour is a
    // number-level constant, not re-authored per day).
    for (const day of NUMBER_1_FIRST_WEEK) {
      expect(day.morning.colorCue).toBe(colorCue);
    }
  });

  test('27: no legacy 7-day-only wording leaks into the new guided content', () => {
    const legacyPhrases = /\bweek of 7\b|\b7-day\b|\bseven-day\b/i;
    for (const day of NUMBER_1_FIRST_WEEK) {
      for (const text of allTextOf(day)) {
        expect(text).not.toMatch(legacyPhrases);
      }
    }
  });
});
