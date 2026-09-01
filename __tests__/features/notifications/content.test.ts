import { buildForecast } from '@/core/forecast';
import type { Profile } from '@/core/types';
import { buildReminderContent } from '@/features/notifications/content';

const profile: Profile = {
  id: 'u1',
  fullName: 'Ada Lovelace',
  dob: '1990-01-15',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('buildReminderContent', () => {
  test('derives title + body from the deterministic forecast for the date', () => {
    const forecast = buildForecast(profile, '2026-09-01');
    const content = buildReminderContent(profile, '2026-09-01');
    expect(content.title).toContain(forecast.headline);
    expect(content.title).toContain(`Personal day ${forecast.personalDay}`);
    expect(content.body).toBe(forecast.body);
  });

  test('is deterministic for a given profile + date', () => {
    expect(buildReminderContent(profile, '2026-09-01')).toEqual(
      buildReminderContent(profile, '2026-09-01'),
    );
  });

  test('changes from one day to the next', () => {
    expect(buildReminderContent(profile, '2026-09-01')).not.toEqual(
      buildReminderContent(profile, '2026-09-02'),
    );
  });

  test('golden content for Ada on 2026-09-01', () => {
    expect(buildReminderContent(profile, '2026-09-01')).toEqual({
      title: 'Personal day 9 · Let something end',
      body: 'A 9 day is for completion and release. Close the loop, give it away, and clear space for what is next.',
    });
  });

  test('rejects an invalid date (delegates to the core parser)', () => {
    expect(() => buildReminderContent(profile, '2026-13-01')).toThrow(RangeError);
  });
});
