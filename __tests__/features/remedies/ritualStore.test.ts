/**
 * Exercises the ritual/quest journey store with an in-memory stand-in for
 * `@/lib/storage` (the real one needs the native AsyncStorage module) and a
 * controllable `todayISO()` so calendar-day rollover can be tested without
 * touching the system clock.
 */
jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => {
      const raw = store.get(k);
      return raw == null ? null : JSON.parse(raw);
    }),
    setItem: jest.fn(async (k: string, v: unknown) => {
      store.set(k, JSON.stringify(v));
    }),
    removeItem: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

let mockToday = '2026-01-01';
jest.mock('@/lib/date', () => ({
  todayISO: jest.fn(() => mockToday),
}));

import { getItem, removeItem, setItem } from '@/lib/storage';
import { useRitualStore, type RitualPersistenceData } from '@/features/remedies/ritualStore';

const RITUAL_KEY = 'remedies.rituals';

const DEFAULT_STATE: RitualPersistenceData = {
  completedNumbers: [],
  questDay: 1,
  lastCompletedDate: null,
  lastQuestCompletionDate: null,
  streakDays: 1,
  dailyPackCompleted: false,
  dailyPackItems: { morning: false, midday: false, evening: false },
};

/** Seed the mocked persisted record directly, bypassing store actions. */
async function seed(overrides: Partial<RitualPersistenceData>): Promise<void> {
  await setItem(RITUAL_KEY, { ...DEFAULT_STATE, ...overrides });
}

/** Simulate a fresh app launch: reset in-memory state, then hydrate from storage. */
async function relaunch(): Promise<void> {
  useRitualStore.setState({ ...DEFAULT_STATE, hydrated: false });
  await useRitualStore.getState().hydrate();
}

beforeEach(async () => {
  mockToday = '2026-01-01';
  await removeItem(RITUAL_KEY);
  useRitualStore.setState({ ...DEFAULT_STATE, hydrated: false });
});

describe('useRitualStore - quest day progression', () => {
  test('fresh state (nothing stored) starts at questDay 1', async () => {
    expect(await getItem(RITUAL_KEY)).toBeNull();
    await relaunch();
    expect(useRitualStore.getState().questDay).toBe(1);
    expect(useRitualStore.getState().lastQuestCompletionDate).toBeNull();
  });

  test('completing the Active Quest does not immediately change questDay', async () => {
    await useRitualStore.getState().completeActiveQuest(4);
    expect(useRitualStore.getState().questDay).toBe(1);
    expect(useRitualStore.getState().lastQuestCompletionDate).toBe('2026-01-01');
  });

  test('a same-day relaunch does not advance questDay', async () => {
    await seed({ questDay: 1, lastQuestCompletionDate: '2026-01-01' });
    await relaunch();
    expect(useRitualStore.getState().questDay).toBe(1);
    expect(useRitualStore.getState().lastQuestCompletionDate).toBe('2026-01-01');
  });

  test('a next-day relaunch advances Day 1 to Day 2 after completion', async () => {
    await seed({ questDay: 1, lastQuestCompletionDate: '2026-01-01' });

    mockToday = '2026-01-02';
    await relaunch();

    expect(useRitualStore.getState().questDay).toBe(2);
    expect(useRitualStore.getState().lastQuestCompletionDate).toBeNull();
  });

  test('a next-day relaunch with no completion does not advance questDay', async () => {
    await seed({ questDay: 1, lastQuestCompletionDate: null });

    mockToday = '2026-01-02';
    await relaunch();

    expect(useRitualStore.getState().questDay).toBe(1);
  });

  test('completing Day 2 does not immediately advance to Day 3', async () => {
    useRitualStore.setState({ questDay: 2 });

    await useRitualStore.getState().completeActiveQuest(3);

    expect(useRitualStore.getState().questDay).toBe(2);
    expect(useRitualStore.getState().lastQuestCompletionDate).toBe('2026-01-01');
  });

  test('a next-day relaunch advances Day 2 to Day 3', async () => {
    await seed({ questDay: 2, lastQuestCompletionDate: '2026-01-01' });

    mockToday = '2026-01-02';
    await relaunch();

    expect(useRitualStore.getState().questDay).toBe(3);
  });

  test('Day 7 never advances to Day 8', async () => {
    await seed({ questDay: 7, lastQuestCompletionDate: '2026-01-01' });

    mockToday = '2026-01-02';
    await relaunch();

    expect(useRitualStore.getState().questDay).toBe(7);
  });

  test('existing daily-pack behavior remains correct', async () => {
    await useRitualStore.getState().togglePackItem('morning');
    await useRitualStore.getState().togglePackItem('midday');
    expect(useRitualStore.getState().dailyPackCompleted).toBe(false);

    await useRitualStore.getState().togglePackItem('evening');
    expect(useRitualStore.getState().dailyPackCompleted).toBe(true);
    expect(useRitualStore.getState().dailyPackItems).toEqual({
      morning: true,
      midday: true,
      evening: true,
    });

    // A same-day relaunch keeps the completed pack.
    await relaunch();
    expect(useRitualStore.getState().dailyPackCompleted).toBe(true);

    // A next-day relaunch resets the daily pack (pre-existing behavior,
    // unrelated to the questDay fix) but must not disturb questDay.
    mockToday = '2026-01-02';
    await relaunch();
    expect(useRitualStore.getState().dailyPackCompleted).toBe(false);
    expect(useRitualStore.getState().dailyPackItems).toEqual({
      morning: false,
      midday: false,
      evening: false,
    });
  });
});
