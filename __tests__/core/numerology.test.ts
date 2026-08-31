import {
  DIGITS,
  buildNumerologyReport,
  calcDestiny,
  calcLifePath,
  calcPersonality,
  calcSoulUrge,
  daysInMonth,
  digitsOf,
  formatISODate,
  isLeapYear,
  isMasterNumber,
  pad2,
  pad4,
  parseISODate,
  reduceNumber,
  sumDigits,
  tokenizeName,
} from '../../src/core/numerology';
import {
  CHALDEAN_MAP,
  PYTHAGOREAN_MAP,
  VOWEL_LETTERS,
  isVowelAt,
  letterValue,
} from '../../src/core/letterValues';
import type { Profile } from '../../src/core/types';

describe('sumDigits', () => {
  test.each([
    [0, 0],
    [5, 5],
    [9, 9],
    [10, 1],
    [29, 11],
    [199, 19],
    [1990, 19],
    [999999, 54],
    [-45, 9],
  ])('sumDigits(%i) === %i', (input, expected) => {
    expect(sumDigits(input)).toBe(expected);
  });
});

describe('digitsOf', () => {
  test.each<[number, number[]]>([
    [0, [0]],
    [7, [7]],
    [10, [1, 0]],
    [1990, [1, 9, 9, 0]],
    [-23, [2, 3]],
  ])('digitsOf(%i)', (input, expected) => {
    expect(digitsOf(input)).toEqual(expected);
  });
});

describe('isMasterNumber', () => {
  test.each([11, 22, 33])('isMasterNumber(%i) === true', (n) => {
    expect(isMasterNumber(n)).toBe(true);
  });
  test.each([0, 1, 5, 10, 12, 21, 23, 32, 44, 110])('isMasterNumber(%i) === false', (n) => {
    expect(isMasterNumber(n)).toBe(false);
  });
});

describe('pad2 / pad4', () => {
  test('pads to width', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(10)).toBe('10');
    expect(pad2(2026)).toBe('2026');
    expect(pad4(7)).toBe('0007');
    expect(pad4(2026)).toBe('2026');
  });
});

describe('reduceNumber', () => {
  test.each<[number, number, number[]]>([
    [5, 5, [5]],
    [9, 9, [9]],
    [10, 1, [10, 1]],
    [39, 3, [39, 12, 3]],
    [48, 3, [48, 12, 3]],
    [1990, 1, [1990, 19, 10, 1]],
    [0, 0, [0]],
    [11, 11, [11]],
    [22, 22, [22]],
    [33, 33, [33]],
    [38, 11, [38, 11]],
    [2999, 11, [2999, 29, 11]],
  ])('reduceNumber(%i) keeps masters -> %i', (input, value, chain) => {
    expect(reduceNumber(input)).toEqual({ value, chain });
  });

  test.each<[number, number, number[]]>([
    [11, 2, [11, 2]],
    [22, 4, [22, 4]],
    [33, 6, [33, 6]],
    [38, 2, [38, 11, 2]],
    [39, 3, [39, 12, 3]],
    [9, 9, [9]],
  ])('reduceNumber(%i, false) fully reduces -> %i', (input, value, chain) => {
    expect(reduceNumber(input, false)).toEqual({ value, chain });
  });

  test('truncates fractional input', () => {
    expect(reduceNumber(39.9).value).toBe(3);
  });

  test.each([-1, -100, NaN, Infinity, -Infinity])('reduceNumber(%p) throws RangeError', (bad) => {
    expect(() => reduceNumber(bad)).toThrow(RangeError);
  });
});

describe('isLeapYear', () => {
  test.each<[number, boolean]>([
    [2000, true],
    [1900, false],
    [2024, true],
    [2023, false],
    [2100, false],
    [2400, true],
    [1600, true],
  ])('isLeapYear(%i) === %p', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });
});

describe('daysInMonth', () => {
  test.each<[number, number, number]>([
    [2024, 1, 31],
    [2024, 2, 29],
    [2023, 2, 28],
    [2000, 2, 29],
    [1900, 2, 28],
    [2024, 4, 30],
    [2024, 6, 30],
    [2024, 11, 30],
    [2024, 12, 31],
  ])('daysInMonth(%i, %i) === %i', (year, month, expected) => {
    expect(daysInMonth(year, month)).toBe(expected);
  });
});

describe('parseISODate', () => {
  test.each<[string, { year: number; month: number; day: number }]>([
    ['2026-09-01', { year: 2026, month: 9, day: 1 }],
    ['1990-01-15', { year: 1990, month: 1, day: 15 }],
    ['2024-02-29', { year: 2024, month: 2, day: 29 }],
    ['2000-12-31', { year: 2000, month: 12, day: 31 }],
    ['  2026-09-01  ', { year: 2026, month: 9, day: 1 }],
  ])('parseISODate(%p)', (input, expected) => {
    expect(parseISODate(input)).toEqual(expected);
  });

  test.each([
    '',
    'garbage',
    '2026-09-01T00:00:00Z',
    '2026/09/01',
    '26-09-01',
    '2026-9-1',
    '2026-09-1',
    '2026-13-01',
    '2026-00-05',
    '2026-02-30',
    '2026-04-31',
    '2026-01-00',
    '2023-02-29',
  ])('parseISODate(%p) throws RangeError', (bad) => {
    expect(() => parseISODate(bad)).toThrow(RangeError);
  });
});

describe('formatISODate', () => {
  test.each<[{ year: number; month: number; day: number }, string]>([
    [{ year: 2026, month: 9, day: 1 }, '2026-09-01'],
    [{ year: 7, month: 3, day: 5 }, '0007-03-05'],
    [{ year: 2024, month: 12, day: 31 }, '2024-12-31'],
  ])('formatISODate(%p) === %p', (input, expected) => {
    expect(formatISODate(input)).toBe(expected);
  });

  test('parse -> format round trip', () => {
    for (const d of ['2026-09-01', '2024-02-29', '1900-02-28', '2000-12-31']) {
      expect(formatISODate(parseISODate(d))).toBe(d);
    }
  });
});

describe('tokenizeName', () => {
  test.each<[string, string[]]>([
    ['John Lennon', ['JOHN', 'LENNON']],
    ['  multiple   spaces  ', ['MULTIPLE', 'SPACES']],
    ["O'Brien", ['O', 'BRIEN']],
    ['Anne-Marie', ['ANNE', 'MARIE']],
    ['lowercase name', ['LOWERCASE', 'NAME']],
    ['Jean-Luc Picard 3rd', ['JEAN', 'LUC', 'PICARD', 'RD']],
    ['12345', []],
    ['', []],
    ['   ', []],
  ])('tokenizeName(%p)', (input, expected) => {
    expect(tokenizeName(input)).toEqual(expected);
  });

  test('folds accents via NFD normalization', () => {
    expect(tokenizeName('Renée')).toEqual(['RENEE']);
    expect(tokenizeName('Zoë Björk')).toEqual(['ZOE', 'BJORK']);
    expect(tokenizeName('José François')).toEqual(['JOSE', 'FRANCOIS']);
    expect(tokenizeName('Ñoño')).toEqual(['NONO']);
  });
});

describe('letterValue - pythagorean', () => {
  test.each<[string, number]>([
    ['A', 1],
    ['J', 1],
    ['S', 1],
    ['I', 9],
    ['R', 9],
    ['Z', 8],
    ['B', 2],
    ['a', 1],
    ['z', 8],
    [' ', 0],
    ['!', 0],
    ['3', 0],
    ['', 0],
  ])('letterValue(%p, pythagorean) === %i', (char, value) => {
    expect(letterValue(char, 'pythagorean')).toBe(value);
  });

  test('every A-Z maps to a value in 1-9', () => {
    for (let i = 0; i < 26; i += 1) {
      const v = letterValue(String.fromCharCode(65 + i), 'pythagorean');
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(9);
    }
  });
});

describe('letterValue - chaldean', () => {
  test.each<[string, number]>([
    ['A', 1],
    ['I', 1],
    ['J', 1],
    ['Q', 1],
    ['Y', 1],
    ['O', 7],
    ['Z', 7],
    ['F', 8],
    ['P', 8],
    ['S', 3],
    ['U', 6],
    ['N', 5],
  ])('letterValue(%p, chaldean) === %i', (char, value) => {
    expect(letterValue(char, 'chaldean')).toBe(value);
  });

  test('chaldean never assigns 9; pythagorean does', () => {
    expect(Object.values(CHALDEAN_MAP)).not.toContain(9);
    expect(Object.values(PYTHAGOREAN_MAP)).toContain(9);
  });
});

describe('isVowelAt', () => {
  test.each<[string, number, boolean]>([
    ['JOHN', 0, false],
    ['JOHN', 1, true],
    ['JOHN', 2, false],
    ['MARY', 3, true],
    ['YOGA', 0, false],
    ['MAYA', 2, false],
    ['KYLA', 1, true],
    ['GYM', 1, true],
    ['DAY', 2, false],
    ['LARRY', 4, true],
    ['AEIOU', 0, true],
    ['AEIOU', 4, true],
    ['ABC', 5, false],
    ['', 0, false],
  ])('isVowelAt(%p, %i) === %p', (word, index, expected) => {
    expect(isVowelAt(word, index)).toBe(expected);
  });

  test('VOWEL_LETTERS is exactly A E I O U', () => {
    expect([...VOWEL_LETTERS].sort()).toEqual(['A', 'E', 'I', 'O', 'U']);
  });
});

describe('name numbers - pythagorean', () => {
  test('John Lennon', () => {
    expect(calcDestiny('John Lennon', 'pythagorean')).toEqual({ value: 4, chain: [49, 13, 4] });
    expect(calcSoulUrge('John Lennon', 'pythagorean')).toEqual({ value: 8, chain: [17, 8] });
    expect(calcPersonality('John Lennon', 'pythagorean')).toEqual({ value: 5, chain: [32, 5] });
  });

  test('Larry Page - contextual Y is treated as a vowel', () => {
    expect(calcDestiny('Larry Page', 'pythagorean')).toEqual({ value: 4, chain: [49, 13, 4] });
    expect(calcSoulUrge('Larry Page', 'pythagorean')).toEqual({ value: 5, chain: [14, 5] });
    expect(calcPersonality('Larry Page', 'pythagorean')).toEqual({ value: 8, chain: [35, 8] });
  });

  test('Ada', () => {
    expect(calcDestiny('Ada', 'pythagorean').value).toBe(6);
    expect(calcSoulUrge('Ada', 'pythagorean').value).toBe(2);
    expect(calcPersonality('Ada', 'pythagorean').value).toBe(4);
  });

  test('empty or non-alphabetic names reduce to 0 without throwing', () => {
    expect(calcDestiny('', 'pythagorean')).toEqual({ value: 0, chain: [0] });
    expect(calcSoulUrge('12345', 'pythagorean')).toEqual({ value: 0, chain: [0] });
    expect(calcPersonality('   ', 'pythagorean')).toEqual({ value: 0, chain: [0] });
  });

  test('destiny = soulUrge + personality before reduction (vowels + consonants = all letters)', () => {
    for (const name of ['John Lennon', 'Larry Page', 'Grace Hopper', 'Yoshiko Yamada']) {
      const d = nameRawSum(name);
      expect(d.all).toBe(d.vowels + d.consonants);
    }
  });
});

describe('name numbers - system differences', () => {
  test('Sun', () => {
    expect(calcDestiny('Sun', 'pythagorean').value).toBe(9);
    expect(calcDestiny('Sun', 'chaldean').value).toBe(5);
  });
});

describe('calcLifePath', () => {
  test.each<[string, number, number[], [number, number, number]]>([
    ['1940-10-09', 6, [15, 6], [9, 1, 5]],
    ['1990-01-15', 8, [8], [6, 1, 1]],
    ['2000-01-01', 4, [4], [1, 1, 2]],
    ['1988-12-29', 22, [22], [11, 3, 8]],
    ['1962-09-11', 11, [29, 11], [11, 9, 9]],
    ['2000-11-29', 6, [24, 6], [11, 11, 2]],
  ])('calcLifePath(%s) -> %i', (dob, value, chain, parts) => {
    expect(calcLifePath(dob)).toEqual({ value, chain, parts });
  });

  test('invalid dob throws RangeError', () => {
    expect(() => calcLifePath('1990-13-01')).toThrow(RangeError);
    expect(() => calcLifePath('not-a-date')).toThrow(RangeError);
  });
});

describe('buildNumerologyReport', () => {
  const lennon: Profile = {
    id: 't',
    fullName: 'John Lennon',
    dob: '1940-10-09',
    system: 'pythagorean',
    createdAt: '2026-01-01T00:00:00Z',
  };

  test('full report for John Lennon', () => {
    expect(buildNumerologyReport(lennon)).toEqual({
      system: 'pythagorean',
      lifePath: 6,
      destiny: 4,
      soulUrge: 8,
      personality: 5,
      birthday: 9,
      reductions: {
        lifePathParts: [9, 1, 5],
        lifePath: [15, 6],
        destiny: [49, 13, 4],
        soulUrge: [17, 8],
        personality: [32, 5],
        birthday: [9],
      },
    });
  });

  test('is deterministic', () => {
    expect(buildNumerologyReport(lennon)).toEqual(buildNumerologyReport(lennon));
  });

  test('does not mutate the input profile', () => {
    const snapshot = JSON.parse(JSON.stringify(lennon));
    buildNumerologyReport(lennon);
    expect(lennon).toEqual(snapshot);
  });

  test('carries the chosen system and swaps name numbers accordingly', () => {
    const base: Profile = { ...lennon, fullName: 'Sun', dob: '2000-01-01' };
    expect(buildNumerologyReport({ ...base, system: 'pythagorean' }).destiny).toBe(9);
    const chaldean = buildNumerologyReport({ ...base, system: 'chaldean' });
    expect(chaldean.destiny).toBe(5);
    expect(chaldean.system).toBe('chaldean');
  });

  test('preserves a master Life Path', () => {
    expect(buildNumerologyReport({ ...lennon, dob: '1988-12-29' }).lifePath).toBe(22);
    expect(buildNumerologyReport({ ...lennon, dob: '1962-09-11' }).lifePath).toBe(11);
  });

  test('birthday is the unreduced day of the month', () => {
    expect(buildNumerologyReport({ ...lennon, dob: '1990-01-15' }).birthday).toBe(15);
    expect(buildNumerologyReport({ ...lennon, dob: '2000-12-31' }).birthday).toBe(31);
  });

  test('every reduction trail is an array of finite numbers', () => {
    const { reductions } = buildNumerologyReport(lennon);
    for (const trail of Object.values(reductions)) {
      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBeGreaterThan(0);
      for (const n of trail) expect(Number.isFinite(n)).toBe(true);
    }
    expect(reductions.lifePathParts).toHaveLength(3);
  });
});

describe('DIGITS', () => {
  test('is 1..9', () => {
    expect(DIGITS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

// Helper: raw (pre-reduction) letter sums, re-derived from the public reduction
// chains so we can assert the vowels + consonants = all-letters invariant.
function nameRawSum(name: string): { all: number; vowels: number; consonants: number } {
  return {
    all: calcDestiny(name, 'pythagorean').chain[0],
    vowels: calcSoulUrge(name, 'pythagorean').chain[0],
    consonants: calcPersonality(name, 'pythagorean').chain[0],
  };
}
