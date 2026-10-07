import { visibleAfternoonActivities } from '@/features/remedies/afternoonVisibility';
import type { PracticeActivity } from '@/data/practiceLibrary';

function ungated(id: string): PracticeActivity {
  return { id, type: 'reflection', prompt: 'Prompt', reflectionPrompt: 'Reflect.' };
}

function gated(id: string, requiresMorningOptionId: string): PracticeActivity {
  return { id, type: 'reflection', prompt: 'Prompt', reflectionPrompt: 'Reflect.', requiresMorningOptionId };
}

describe('visibleAfternoonActivities', () => {
  test('1: no gated activities - all activities remain visible, regardless of selection', () => {
    const activities = [ungated('a'), ungated('b'), ungated('c')];

    expect(visibleAfternoonActivities(activities, undefined)).toEqual(activities);
    expect(visibleAfternoonActivities(activities, 'morning-1')).toEqual(activities);
  });

  test('2: a matching Morning option shows only the matching branch, plus any ungated activities', () => {
    const always = ungated('always');
    const branchA = gated('branch-a', 'morning-1');
    const branchB = gated('branch-b', 'morning-2');

    const result = visibleAfternoonActivities([always, branchA, branchB], 'morning-1');

    expect(result).toEqual([always, branchA]);
  });

  test('3: non-matching branches are hidden', () => {
    const branchA = gated('branch-a', 'morning-1');
    const branchB = gated('branch-b', 'morning-2');
    const branchC = gated('branch-c', 'morning-3');

    const result = visibleAfternoonActivities([branchA, branchB, branchC], 'morning-2');

    expect(result).toEqual([branchB]);
    expect(result).not.toContain(branchA);
    expect(result).not.toContain(branchC);
  });

  test('4: an undefined Morning selection hides gated branches while ungated activities remain visible', () => {
    const always = ungated('always');
    const branchA = gated('branch-a', 'morning-1');
    const branchB = gated('branch-b', 'morning-2');

    const result = visibleAfternoonActivities([always, branchA, branchB], undefined);

    expect(result).toEqual([always]);
  });

  test('5: multiple branches with different option ids - exactly one matching branch is shown', () => {
    const branchA = gated('branch-a', 'morning-1');
    const branchB = gated('branch-b', 'morning-2');
    const branchC = gated('branch-c', 'morning-3');

    const result = visibleAfternoonActivities([branchA, branchB, branchC], 'morning-3');

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(branchC);
  });

  test('a gated day with no Morning selection yet hides every activity, not just some', () => {
    const branchA = gated('branch-a', 'morning-1');
    const branchB = gated('branch-b', 'morning-2');
    const branchC = gated('branch-c', 'morning-3');

    expect(visibleAfternoonActivities([branchA, branchB, branchC], undefined)).toEqual([]);
  });

  test('a multiChoice-style array selection never matches a single required option id', () => {
    const branchA = gated('branch-a', 'morning-1');

    expect(visibleAfternoonActivities([branchA], ['morning-1'])).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const activities = [gated('branch-a', 'morning-1'), gated('branch-b', 'morning-2')];
    const snapshot = [...activities];

    visibleAfternoonActivities(activities, 'morning-1');

    expect(activities).toEqual(snapshot);
  });
});
