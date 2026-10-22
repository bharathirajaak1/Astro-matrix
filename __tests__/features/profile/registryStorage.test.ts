/**
 * Exercises `readClassified()` in isolation, mocking only `getRawItem` from
 * `@/lib/storage` - the one function this module depends on. Not wired to
 * any real key (`profiles.all`/`profiles.activeId` do not exist yet); this
 * proves the classification primitive itself, generically, plus its
 * end-to-end composition with the real profile validators from Stage 1.
 */
jest.mock('@/lib/storage', () => ({
  getRawItem: jest.fn(),
}));

import { getRawItem } from '@/lib/storage';
import { readClassified } from '@/features/profile/registryStorage';
import { isValidProfileArray } from '@/features/profile/validation';
import type { Profile } from '@/core/types';

const getRawItemMock = getRawItem as jest.Mock;

interface Shape {
  foo: string;
}

function isValidShape(value: unknown): value is Shape {
  return typeof value === 'object' && value !== null && typeof (value as Shape).foo === 'string';
}

const MAYA: Profile = {
  id: 'p_maya',
  fullName: 'Maya Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  getRawItemMock.mockReset();
});

describe('readClassified - generic shape', () => {
  test('a genuinely absent key classifies as absent', async () => {
    getRawItemMock.mockResolvedValue(null);

    const result = await readClassified('some.key', isValidShape);

    expect(result).toEqual({ status: 'absent' });
  });

  test('a valid, well-formed value classifies as ok', async () => {
    getRawItemMock.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

    const result = await readClassified('some.key', isValidShape);

    expect(result).toEqual({ status: 'ok', value: { foo: 'bar' } });
  });

  test('unparseable JSON classifies as malformed, not absent, and preserves the raw bytes', async () => {
    getRawItemMock.mockResolvedValue('{not valid json');

    const result = await readClassified('some.key', isValidShape);

    expect(result).toEqual({ status: 'malformed', raw: '{not valid json' });
  });

  test('parseable JSON that fails shape validation classifies as malformed, not absent', async () => {
    getRawItemMock.mockResolvedValue(JSON.stringify({ wrongField: 1 }));

    const result = await readClassified('some.key', isValidShape);

    expect(result.status).toBe('malformed');
    if (result.status === 'malformed') {
      expect(result.raw).toBe(JSON.stringify({ wrongField: 1 }));
    }
  });

  test('a storage read failure classifies as read_failure, distinct from malformed', async () => {
    const thrown = new Error('native read failed');
    getRawItemMock.mockRejectedValue(thrown);

    const result = await readClassified('some.key', isValidShape);

    expect(result).toEqual({ status: 'read_failure', error: thrown });
  });
});

describe('readClassified - composed with the real profile validators', () => {
  test('a valid, empty profile registry classifies as ok', async () => {
    getRawItemMock.mockResolvedValue(JSON.stringify([]));

    const result = await readClassified('profiles.all', isValidProfileArray);

    expect(result).toEqual({ status: 'ok', value: [] });
  });

  test('a valid, populated profile registry classifies as ok', async () => {
    getRawItemMock.mockResolvedValue(JSON.stringify([MAYA]));

    const result = await readClassified('profiles.all', isValidProfileArray);

    expect(result).toEqual({ status: 'ok', value: [MAYA] });
  });

  test('duplicate ids in a stored registry classify the whole array as malformed', async () => {
    const raw = JSON.stringify([MAYA, { ...MAYA }]);
    getRawItemMock.mockResolvedValue(raw);

    const result = await readClassified('profiles.all', isValidProfileArray);

    expect(result).toEqual({ status: 'malformed', raw });
  });

  test('an invalid field in one stored entry classifies the whole array as malformed', async () => {
    const broken = { ...MAYA, system: 'western' };
    const raw = JSON.stringify([broken]);
    getRawItemMock.mockResolvedValue(raw);

    const result = await readClassified('profiles.all', isValidProfileArray);

    expect(result).toEqual({ status: 'malformed', raw });
  });
});
