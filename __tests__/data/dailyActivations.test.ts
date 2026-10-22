import {
  LOGIC_TASKS,
  SPATIAL_TASKS,
  MEMORY_TASKS,
  LANGUAGE_TASKS,
  OBSERVATION_TASKS,
  tasksForDay,
  type CognitiveTask,
  type CognitiveTaskCategory,
} from '../../src/data/dailyActivations';

const CATEGORIES: readonly CognitiveTaskCategory[] = ['logic', 'spatial', 'memory', 'language', 'observation'];

/** A synthetic 21-entry-per-category fixture bank, used only to exercise
 *  days (e.g. day 21) that the real small stub bank doesn't reach yet -
 *  this step is explicitly about the data model and selector, not about
 *  authoring all 105 real questions. */
function fixtureBank(): Record<CognitiveTaskCategory, CognitiveTask[]> {
  const bank = {} as Record<CognitiveTaskCategory, CognitiveTask[]>;
  for (const category of CATEGORIES) {
    bank[category] = Array.from({ length: 21 }, (_, i) => {
      const day = i + 1;
      return {
        id: `${category}-fixture-d${day}`,
        category,
        day,
        prompt: `Fixture prompt for ${category} day ${day}`,
        options: [
          { id: `${category}-fixture-d${day}-1`, label: 'A' },
          { id: `${category}-fixture-d${day}-2`, label: 'B' },
        ],
        correctOptionId: `${category}-fixture-d${day}-1`,
      };
    });
  }
  return bank;
}

/** A content-identity signature for a task - built from `studyContent`,
 *  `prompt`, and option labels, never from `id`/`day` (those are metadata,
 *  not content, and two different ids could still carry the same question). */
function contentSignature(task: CognitiveTask): string {
  return [task.studyContent ?? '', task.prompt, task.options.map((o) => o.label).join('|')].join('::');
}

/** Groups of days within one category's bank that share an identical
 *  content signature - empty when every day's question content is unique.
 *  Returning the actual day numbers (rather than a plain boolean) means a
 *  failing assertion on this points straight at which days collided. */
function findDuplicateContentDayGroups(tasks: readonly CognitiveTask[]): number[][] {
  const daysBySignature = new Map<string, number[]>();
  for (const task of tasks) {
    const signature = contentSignature(task);
    const days = daysBySignature.get(signature);
    if (days) days.push(task.day);
    else daysBySignature.set(signature, [task.day]);
  }
  return Array.from(daysBySignature.values())
    .filter((days) => days.length > 1)
    .map((days) => days.slice().sort((a, b) => a - b));
}

describe('tasksForDay', () => {
  test('Day 1 returns 5 tasks', () => {
    expect(tasksForDay(1)).toHaveLength(5);
  });

  test('Day 21 returns 5 tasks (against a full 21-entry fixture bank)', () => {
    expect(tasksForDay(21, fixtureBank())).toHaveLength(5);
  });

  test('returned tasks contain exactly one task from each category, in a fixed order', () => {
    const tasks = tasksForDay(1);
    expect(tasks.map((t) => t.category)).toEqual(['logic', 'spatial', 'memory', 'language', 'observation']);
  });

  test.each([1, 2, 3])('Day %i returns the Nth task from each category', (day) => {
    const tasks = tasksForDay(day);
    for (const task of tasks) {
      expect(task.day).toBe(day);
    }
  });

  test('Day 2 returns the exact known stub entries', () => {
    const tasks = tasksForDay(2);
    expect(tasks.find((t) => t.category === 'logic')?.id).toBe('logic-d2');
    expect(tasks.find((t) => t.category === 'spatial')?.id).toBe('spatial-d2');
    expect(tasks.find((t) => t.category === 'memory')?.id).toBe('memory-d2');
    expect(tasks.find((t) => t.category === 'language')?.id).toBe('language-d2');
    expect(tasks.find((t) => t.category === 'observation')?.id).toBe('observation-d2');
  });

  test('day rotates correctly across a full 21-entry fixture bank', () => {
    const bank = fixtureBank();
    expect(tasksForDay(1, bank).every((t) => t.day === 1)).toBe(true);
    expect(tasksForDay(10, bank).every((t) => t.day === 10)).toBe(true);
    expect(tasksForDay(21, bank).every((t) => t.day === 21)).toBe(true);
  });

  test('Focus Number plays no role in selection - the selector takes only (day, bank?)', () => {
    // Structural guarantee: `bank` has a default value, so it is excluded
    // from `.length` - this proves the function has exactly one required
    // input (`day`) and no focusNumber/missingNumbers/counts parameter.
    expect(tasksForDay.length).toBe(1);
  });

  test('Focus Number plays no role in selection - repeated calls for the same day are identical', () => {
    const first = tasksForDay(5);
    const second = tasksForDay(5);
    expect(first).toEqual(second);
  });

  test.each([0, -1, 1.5, 22, 9999])('invalid day %p returns an empty array, never throws', (day) => {
    expect(() => tasksForDay(day)).not.toThrow();
    expect(tasksForDay(day)).toEqual([]);
  });

  test('invalid day behavior is deterministic across repeated calls', () => {
    expect(tasksForDay(0)).toEqual(tasksForDay(0));
    expect(tasksForDay(22)).toEqual(tasksForDay(22));
  });

  test('every day 1-21 now returns 5 real tasks - Observation was the last category to leave stub status', () => {
    // Previously Day 4 returned [] because at least one category was still
    // a small stub. Now that Logic/Spatial/Memory/Language/Observation are
    // all full 21-day production banks, there is no day in 1-21 left to
    // mask - this is expected, permanent behavior, not a regression.
    for (let day = 1; day <= 21; day += 1) {
      expect(tasksForDay(day)).toHaveLength(5);
    }
  });

  test('does not mutate the source question bank', () => {
    const bank = fixtureBank();
    const snapshot = JSON.stringify(bank);
    tasksForDay(1, bank);
    tasksForDay(21, bank);
    tasksForDay(0, bank);
    expect(JSON.stringify(bank)).toBe(snapshot);
  });

  test('does not mutate the default module question bank either', () => {
    const before = JSON.stringify(tasksForDay(1));
    tasksForDay(1);
    tasksForDay(2);
    tasksForDay(3);
    const after = JSON.stringify(tasksForDay(1));
    expect(after).toBe(before);
  });
});

describe('Logic production task bank (Days 1-21)', () => {
  // Verified against `LOGIC_TASKS` directly, not `tasksForDay()`: the
  // selector intentionally returns [] for any day where ANY category lacks
  // an entry (see the "invalid day"/"beyond the stub bank" tests above),
  // and Spatial/Memory/Language/Observation are still small stubs - so
  // `tasksForDay(4..21)` is correctly masked today even though Logic's own
  // 21-day bank is complete. That masking behavior is a separate, already-
  // tested concern and must not be confused with the Logic bank's own
  // integrity, which these tests check directly.

  test('Logic Days 1-21 are all available', () => {
    expect(LOGIC_TASKS).toHaveLength(21);
    const days = LOGIC_TASKS.map((t) => t.day).sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  test('each Logic day returns exactly one Logic task', () => {
    for (let day = 1; day <= 21; day += 1) {
      const dayLogicTasks = LOGIC_TASKS.filter((t) => t.day === day);
      expect(dayLogicTasks).toHaveLength(1);
    }
  });

  test('all 21 Logic task ids are unique', () => {
    const ids = LOGIC_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
  });

  test.each(Array.from({ length: 21 }, (_, i) => i + 1))('Logic Day %i task is well-formed', (day) => {
    const task = LOGIC_TASKS.find((t) => t.day === day);
    expect(task).toBeDefined();
    expect(task?.category).toBe('logic');
    expect(task?.options).toHaveLength(4);
    const optionIds = task?.options.map((o) => o.id) ?? [];
    expect(new Set(optionIds).size).toBe(4);
    expect(optionIds).toContain(task?.correctOptionId);
  });

  test('no Logic task has studyContent', () => {
    for (const task of LOGIC_TASKS) {
      expect(task.studyContent).toBeUndefined();
    }
  });

  test('the 21 Logic tasks contain no duplicate task ids', () => {
    const ids = LOGIC_TASKS.map((t) => t.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  test('the 21 Logic tasks contain no duplicate question content across the cycle', () => {
    expect(findDuplicateContentDayGroups(LOGIC_TASKS)).toEqual([]);
  });

  test('Logic tasks for Days 1-3 are correctly wired into tasksForDay() (the days not yet masked by other stub categories)', () => {
    for (let day = 1; day <= 3; day += 1) {
      const viaSelector = tasksForDay(day).find((t) => t.category === 'logic');
      const viaBank = LOGIC_TASKS.find((t) => t.day === day);
      expect(viaSelector).toEqual(viaBank);
    }
  });
});

describe('Spatial production task bank (Days 1-21)', () => {
  // Same caveat as the Logic bank above: verified against `SPATIAL_TASKS`
  // directly, not `tasksForDay()`, since Memory/Language/Observation are
  // still small stubs and `tasksForDay()` correctly returns [] for any day
  // where any category lacks an entry - that masking is a separate,
  // already-tested concern, not a Spatial bank integrity issue.

  test('Spatial Days 1-21 are all available', () => {
    expect(SPATIAL_TASKS).toHaveLength(21);
    const days = SPATIAL_TASKS.map((t) => t.day).sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  test('each Spatial day returns exactly one Spatial task', () => {
    for (let day = 1; day <= 21; day += 1) {
      const daySpatialTasks = SPATIAL_TASKS.filter((t) => t.day === day);
      expect(daySpatialTasks).toHaveLength(1);
    }
  });

  test('all 21 Spatial task ids are unique', () => {
    const ids = SPATIAL_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
  });

  test.each(Array.from({ length: 21 }, (_, i) => i + 1))('Spatial Day %i task is well-formed', (day) => {
    const task = SPATIAL_TASKS.find((t) => t.day === day);
    expect(task).toBeDefined();
    expect(task?.category).toBe('spatial');
    expect(task?.options).toHaveLength(4);
    const optionIds = task?.options.map((o) => o.id) ?? [];
    expect(new Set(optionIds).size).toBe(4);
    expect(optionIds).toContain(task?.correctOptionId);
  });

  test('no Spatial task has studyContent', () => {
    for (const task of SPATIAL_TASKS) {
      expect(task.studyContent).toBeUndefined();
    }
  });

  test('the 21 Spatial tasks contain no duplicate task ids', () => {
    const ids = SPATIAL_TASKS.map((t) => t.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  test('the 21 Spatial tasks contain no duplicate question content across the cycle', () => {
    expect(findDuplicateContentDayGroups(SPATIAL_TASKS)).toEqual([]);
  });

  test('Spatial tasks for Days 1-3 are correctly wired into tasksForDay() (the days not yet masked by other stub categories)', () => {
    for (let day = 1; day <= 3; day += 1) {
      const viaSelector = tasksForDay(day).find((t) => t.category === 'spatial');
      const viaBank = SPATIAL_TASKS.find((t) => t.day === day);
      expect(viaSelector).toEqual(viaBank);
    }
  });

  test('the frozen Logic task bank is unaffected by the new Spatial bank', () => {
    expect(LOGIC_TASKS).toHaveLength(21);
    const ids = LOGIC_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
    for (const task of LOGIC_TASKS) {
      expect(task.category).toBe('logic');
    }
  });
});

describe('Memory production task bank (Days 1-21)', () => {
  // Same caveat as the Logic/Spatial banks above: verified against
  // `MEMORY_TASKS` directly, not `tasksForDay()`, since Language/Observation
  // are still small stubs and `tasksForDay()` correctly returns [] for any
  // day where any category lacks an entry - a separate, already-tested
  // concern, not a Memory bank integrity issue.

  test('exactly 21 Memory tasks exist', () => {
    expect(MEMORY_TASKS).toHaveLength(21);
  });

  test('Days 1-21 are all present exactly once', () => {
    const days = MEMORY_TASKS.map((t) => t.day).sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
    for (let day = 1; day <= 21; day += 1) {
      expect(MEMORY_TASKS.filter((t) => t.day === day)).toHaveLength(1);
    }
  });

  test('category is "memory" for all 21 tasks', () => {
    for (const task of MEMORY_TASKS) {
      expect(task.category).toBe('memory');
    }
  });

  test('every task has non-empty studyContent', () => {
    for (const task of MEMORY_TASKS) {
      expect(typeof task.studyContent).toBe('string');
      expect(task.studyContent).not.toBe('');
    }
  });

  test('studyContent is different from the recall prompt for every task', () => {
    for (const task of MEMORY_TASKS) {
      expect(task.studyContent).not.toBe(task.prompt);
    }
  });

  test.each(Array.from({ length: 21 }, (_, i) => i + 1))('Memory Day %i task is well-formed', (day) => {
    const task = MEMORY_TASKS.find((t) => t.day === day);
    expect(task).toBeDefined();
    expect(task?.options).toHaveLength(4);
    const optionIds = task?.options.map((o) => o.id) ?? [];
    expect(new Set(optionIds).size).toBe(4);
    expect(optionIds).toContain(task?.correctOptionId);
  });

  test('no duplicate task ids across the 21 Memory tasks', () => {
    const ids = MEMORY_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  test('the 21 Memory tasks contain no duplicate question content across the cycle', () => {
    expect(findDuplicateContentDayGroups(MEMORY_TASKS)).toEqual([]);
  });

  test('Memory tasks for Days 1-3 are correctly wired into tasksForDay() (the days not yet masked by other stub categories)', () => {
    for (let day = 1; day <= 3; day += 1) {
      const viaSelector = tasksForDay(day).find((t) => t.category === 'memory');
      const viaBank = MEMORY_TASKS.find((t) => t.day === day);
      expect(viaSelector).toEqual(viaBank);
    }
  });

  test('the frozen Logic and Spatial banks are unaffected by the new Memory bank', () => {
    expect(LOGIC_TASKS).toHaveLength(21);
    expect(SPATIAL_TASKS).toHaveLength(21);
    for (const task of LOGIC_TASKS) expect(task.category).toBe('logic');
    for (const task of SPATIAL_TASKS) expect(task.category).toBe('spatial');
  });
});

describe('Language production task bank (Days 1-21)', () => {
  // Same caveat as the Logic/Spatial/Memory banks above: verified against
  // `LANGUAGE_TASKS` directly, not `tasksForDay()`, since Observation is
  // still a small stub and `tasksForDay()` correctly returns [] for any day
  // where any category lacks an entry - a separate, already-tested concern,
  // not a Language bank integrity issue.

  test('Language Days 1-21 are all available', () => {
    expect(LANGUAGE_TASKS).toHaveLength(21);
    const days = LANGUAGE_TASKS.map((t) => t.day).sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  test('each Language day returns exactly one Language task', () => {
    for (let day = 1; day <= 21; day += 1) {
      const dayLanguageTasks = LANGUAGE_TASKS.filter((t) => t.day === day);
      expect(dayLanguageTasks).toHaveLength(1);
    }
  });

  test('all 21 Language task ids are unique', () => {
    const ids = LANGUAGE_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
  });

  test.each(Array.from({ length: 21 }, (_, i) => i + 1))('Language Day %i task is well-formed', (day) => {
    const task = LANGUAGE_TASKS.find((t) => t.day === day);
    expect(task).toBeDefined();
    expect(task?.category).toBe('language');
    expect(task?.options).toHaveLength(4);
    const optionIds = task?.options.map((o) => o.id) ?? [];
    expect(new Set(optionIds).size).toBe(4);
    expect(optionIds).toContain(task?.correctOptionId);
  });

  test('no Language task has studyContent', () => {
    for (const task of LANGUAGE_TASKS) {
      expect(task.studyContent).toBeUndefined();
    }
  });

  test('the 21 Language tasks contain no duplicate task ids', () => {
    const ids = LANGUAGE_TASKS.map((t) => t.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  test('the 21 Language tasks contain no duplicate question content across the cycle', () => {
    expect(findDuplicateContentDayGroups(LANGUAGE_TASKS)).toEqual([]);
  });

  test('Language tasks for Days 1-3 are correctly wired into tasksForDay() (the days not yet masked by other stub categories)', () => {
    for (let day = 1; day <= 3; day += 1) {
      const viaSelector = tasksForDay(day).find((t) => t.category === 'language');
      const viaBank = LANGUAGE_TASKS.find((t) => t.day === day);
      expect(viaSelector).toEqual(viaBank);
    }
  });

  test('the frozen Logic, Spatial, and Memory banks are unaffected by the new Language bank', () => {
    expect(LOGIC_TASKS).toHaveLength(21);
    expect(SPATIAL_TASKS).toHaveLength(21);
    expect(MEMORY_TASKS).toHaveLength(21);
    for (const task of LOGIC_TASKS) expect(task.category).toBe('logic');
    for (const task of SPATIAL_TASKS) expect(task.category).toBe('spatial');
    for (const task of MEMORY_TASKS) expect(task.category).toBe('memory');
  });
});

describe('Observation production task bank (Days 1-21)', () => {
  // Observation is the fifth and final category to move from stub to
  // production - with this bank in place, every category now has all 21
  // days, so (unlike the Logic/Spatial/Memory/Language steps before it)
  // there is no longer a masking caveat: `tasksForDay()` now returns real
  // data for every day in 1-21, not just Days 1-3.

  test('Observation Days 1-21 are all available', () => {
    expect(OBSERVATION_TASKS).toHaveLength(21);
    const days = OBSERVATION_TASKS.map((t) => t.day).sort((a, b) => a - b);
    expect(days).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  test('each Observation day returns exactly one Observation task', () => {
    for (let day = 1; day <= 21; day += 1) {
      const dayObservationTasks = OBSERVATION_TASKS.filter((t) => t.day === day);
      expect(dayObservationTasks).toHaveLength(1);
    }
  });

  test('all 21 Observation task ids are unique', () => {
    const ids = OBSERVATION_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
  });

  test.each(Array.from({ length: 21 }, (_, i) => i + 1))('Observation Day %i task is well-formed', (day) => {
    const task = OBSERVATION_TASKS.find((t) => t.day === day);
    expect(task).toBeDefined();
    expect(task?.category).toBe('observation');
    expect(task?.options).toHaveLength(4);
    const optionIds = task?.options.map((o) => o.id) ?? [];
    expect(new Set(optionIds).size).toBe(4);
    expect(optionIds).toContain(task?.correctOptionId);
  });

  test('no Observation task has studyContent', () => {
    for (const task of OBSERVATION_TASKS) {
      expect(task.studyContent).toBeUndefined();
    }
  });

  test('the 21 Observation tasks contain no duplicate task ids', () => {
    const ids = OBSERVATION_TASKS.map((t) => t.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  test('the 21 Observation tasks contain no duplicate question content across the cycle', () => {
    expect(findDuplicateContentDayGroups(OBSERVATION_TASKS)).toEqual([]);
  });

  test('Observation tasks for every day 1-21 are correctly wired into tasksForDay() (no masking left - this is the final category)', () => {
    for (let day = 1; day <= 21; day += 1) {
      const viaSelector = tasksForDay(day).find((t) => t.category === 'observation');
      const viaBank = OBSERVATION_TASKS.find((t) => t.day === day);
      expect(viaSelector).toEqual(viaBank);
    }
  });

  test('the frozen Logic, Spatial, Memory, and Language banks are unaffected by the new Observation bank', () => {
    expect(LOGIC_TASKS).toHaveLength(21);
    expect(SPATIAL_TASKS).toHaveLength(21);
    expect(MEMORY_TASKS).toHaveLength(21);
    expect(LANGUAGE_TASKS).toHaveLength(21);
    for (const task of LOGIC_TASKS) expect(task.category).toBe('logic');
    for (const task of SPATIAL_TASKS) expect(task.category).toBe('spatial');
    for (const task of MEMORY_TASKS) expect(task.category).toBe('memory');
    for (const task of LANGUAGE_TASKS) expect(task.category).toBe('language');
  });
});

describe('CognitiveTask model - studyContent', () => {
  test('Memory tasks contain studyContent', () => {
    for (const day of [1, 2, 3]) {
      const memoryTask = tasksForDay(day).find((t) => t.category === 'memory');
      expect(memoryTask?.studyContent).toBeDefined();
      expect(typeof memoryTask?.studyContent).toBe('string');
      expect(memoryTask?.studyContent).not.toBe('');
    }
  });

  test('Memory studyContent is separate from prompt, not a duplicate of it', () => {
    for (const day of [1, 2, 3]) {
      const memoryTask = tasksForDay(day).find((t) => t.category === 'memory');
      expect(memoryTask?.studyContent).not.toBe(memoryTask?.prompt);
    }
  });

  test('non-Memory tasks do not require (and do not have) studyContent', () => {
    for (const day of [1, 2, 3]) {
      const tasks = tasksForDay(day).filter((t) => t.category !== 'memory');
      expect(tasks).toHaveLength(4);
      for (const task of tasks) {
        expect(task.studyContent).toBeUndefined();
      }
    }
  });

  test('studyContent is optional at the type level - a task without it is still a valid CognitiveTask', () => {
    const taskWithoutStudyContent: CognitiveTask = {
      id: 'fixture-no-study-content',
      category: 'logic',
      day: 1,
      prompt: 'Fixture prompt',
      options: [{ id: 'fixture-1', label: 'A' }],
      correctOptionId: 'fixture-1',
    };
    expect(taskWithoutStudyContent.studyContent).toBeUndefined();
  });
});
