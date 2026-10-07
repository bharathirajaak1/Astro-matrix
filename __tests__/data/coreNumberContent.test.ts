import {
  getCoreNumberInterpretation,
  getCoreNumberSummary,
  type CoreNumberKey,
} from '../../src/data/coreNumberContent';
import { NUMBER_ESSENCE } from '../../src/data/numberEssence';
import { LIFE_PATH_ARCHETYPES, DESTINY_ARCHETYPES, SOUL_URGE_ARCHETYPES } from '../../src/core/archetypes';
import type { NumerologyReport } from '../../src/core/types';

const CORE_KEYS: CoreNumberKey[] = ['lifePath', 'destiny', 'soulUrge', 'personality', 'birthday'];
const SINGLE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const MASTER_NUMBERS = [11, 22, 33];
const ALL_LIFE_PATH_VALUES = [...SINGLE_DIGITS, ...MASTER_NUMBERS];

const BANNED_WORDS = /\b(weak|bad|doomed|guarantee|guaranteed|cure|cures|certain to|will definitely|proves)\b/i;

/** Phrases the Life Path rewrite was specifically asked to avoid. */
const BANNED_LIFE_PATH_PHRASES = [
  'recurring pull',
  'across different seasons of life',
  'natural inclination toward',
  'expression of your energetic pattern',
  'dimension of your personality',
  'may manifest as',
  'your inherent tendencies',
];

function fakeReport(overrides: Partial<NumerologyReport> = {}): NumerologyReport {
  return {
    system: 'pythagorean',
    lifePath: 1,
    destiny: 2,
    soulUrge: 3,
    personality: 4,
    birthday: 17,
    reductions: {},
    ...overrides,
  };
}

describe('getCoreNumberInterpretation', () => {
  test('returns all six structured sections (no Reflect) for every Core Number key, for every single digit 1-9', () => {
    for (const key of CORE_KEYS) {
      for (const digit of SINGLE_DIGITS) {
        const section = getCoreNumberInterpretation(key, digit);
        expect(section.represents.length).toBeGreaterThan(0);
        expect(section.yourInterpretation.length).toBeGreaterThan(0);
        expect(section.showsUpAs.length).toBeGreaterThan(0);
        expect(section.strengths.length).toBeGreaterThan(0);
        expect(section.mindfulOf.length).toBeGreaterThan(0);
        expect(section.howToUse.length).toBeGreaterThan(0);
        expect('reflect' in section).toBe(false);
      }
    }
  });

  test('master numbers (11, 22, 33) are handled distinctly, never silently reduced to a single digit', () => {
    for (const key of CORE_KEYS) {
      for (const master of MASTER_NUMBERS) {
        const masterSection = getCoreNumberInterpretation(key, master);
        const reducedDigitSection = getCoreNumberInterpretation(key, master === 11 ? 2 : master === 22 ? 4 : 6);
        expect(masterSection.yourInterpretation).not.toBe(reducedDigitSection.yourInterpretation);
      }
    }
  });

  test('the five categories give different content for the same underlying value (not identical concepts)', () => {
    const texts = CORE_KEYS.map((key) => getCoreNumberInterpretation(key, 5).yourInterpretation);
    const uniqueTexts = new Set(texts);
    expect(uniqueTexts.size).toBe(CORE_KEYS.length);

    const showUps = CORE_KEYS.map((key) => getCoreNumberInterpretation(key, 5).showsUpAs.join(' | '));
    expect(new Set(showUps).size).toBe(CORE_KEYS.length);
  });

  describe('Life Path - rewritten in plain English, no longer sourced from LIFE_PATH_ARCHETYPES', () => {
    test('no longer reuses the old, more abstract archetype description', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('lifePath', value).yourInterpretation).not.toBe(
          LIFE_PATH_ARCHETYPES[value].description,
        );
      }
    });

    test('every value has its own complete, distinct set of sections', () => {
      const seen = new Set<string>();
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('lifePath', value);
        expect(section.yourInterpretation.length).toBeGreaterThan(0);
        expect(section.showsUpAs).toHaveLength(3);
        expect(section.strengths).toHaveLength(3);
        expect(section.mindfulOf).toHaveLength(3);
        expect(section.howToUse.length).toBeGreaterThan(0);
        expect(seen.has(section.yourInterpretation)).toBe(false);
        seen.add(section.yourInterpretation);
      }
    });

    test('uses personal, conversational language ("You may" / "You might") rather than abstract phrasing', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('lifePath', value);
        const allText = [
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ].join(' ');
        expect(allText).toMatch(/\bYou (may|might|can)\b/);
      }
    });

    test('avoids every phrase the plain-English rewrite was specifically asked to avoid', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('lifePath', value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ]
          .join(' ')
          .toLowerCase();
        for (const phrase of BANNED_LIFE_PATH_PHRASES) {
          expect(allText).not.toContain(phrase);
        }
      }
    });

    test("WHAT THIS NUMBER REPRESENTS is the same simple, static description for every Life Path value", () => {
      const represents = getCoreNumberInterpretation('lifePath', 1).represents;
      expect(represents).toMatch(/one of the most important Core Numbers/i);
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('lifePath', value).represents).toBe(represents);
      }
    });

    test('the Life Path 4 content matches the approved style benchmark', () => {
      const section = getCoreNumberInterpretation('lifePath', 4);
      expect(section.yourInterpretation).toContain('practicality, stability and building things step by step');
      expect(section.showsUpAs).toContain('You may feel more comfortable when you have a clear plan to follow.');
      expect(section.strengths).toContain('You can be dependable when others need someone they can count on.');
    });
  });

  describe('Personality - rewritten with richer, outward-impression-focused content', () => {
    const SITUATIONAL_CONTEXT_PATTERN =
      /first meeting|conversation|group discussion|work setting|social situation|unfamiliar environment/i;

    test('every value has non-empty content with the expected three-bullet shape', () => {
      const seen = new Set<string>();
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('personality', value);
        expect(section.yourInterpretation.length).toBeGreaterThan(0);
        expect(section.showsUpAs).toHaveLength(3);
        expect(section.strengths).toHaveLength(3);
        expect(section.mindfulOf).toHaveLength(3);
        expect(section.howToUse.length).toBeGreaterThan(0);
        expect(seen.has(section.yourInterpretation)).toBe(false);
        seen.add(section.yourInterpretation);
      }
    });

    test('"Your Interpretation" is meaningfully richer than a single short sentence', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('personality', value).yourInterpretation;
        // At least 2-3 sentences, per the content requirement.
        const sentenceCount = (text.match(/[.!?](?:\s|$)/g) ?? []).length;
        expect(sentenceCount).toBeGreaterThanOrEqual(2);
        expect(text.length).toBeGreaterThan(120);
      }
    });

    test('uses reflective, non-deterministic language ("may" / "can" / "often associated with")', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('personality', value).yourInterpretation;
        expect(text).toMatch(/\b(may|can|often associated with|traditionally suggests?)\b/i);
      }
    });

    test('"How It May Show Up" is concrete and situational, not abstract', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const showsUpAs = getCoreNumberInterpretation('personality', value).showsUpAs;
        for (const bullet of showsUpAs) {
          expect(bullet).toMatch(SITUATIONAL_CONTEXT_PATTERN);
        }
      }
    });

    test('does not simply reuse generic NUMBER_ESSENCE wording', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('personality', value);
        const essenceThemes = NUMBER_ESSENCE[value].themes;
        for (const theme of essenceThemes) {
          expect(section.yourInterpretation).not.toContain(theme);
        }
      }
    });

    test('is category-specific - not identical to Life Path, Destiny or Soul Urge content for the same value', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const personality = getCoreNumberInterpretation('personality', value);
        const lifePath = getCoreNumberInterpretation('lifePath', value);
        const destiny = getCoreNumberInterpretation('destiny', value);
        const soulUrge = getCoreNumberInterpretation('soulUrge', value);
        expect(personality.yourInterpretation).not.toBe(lifePath.yourInterpretation);
        expect(personality.yourInterpretation).not.toBe(destiny.yourInterpretation);
        expect(personality.yourInterpretation).not.toBe(soulUrge.yourInterpretation);
        expect(personality.showsUpAs).not.toEqual(lifePath.showsUpAs);
        expect(personality.showsUpAs).not.toEqual(destiny.showsUpAs);
        expect(personality.showsUpAs).not.toEqual(soulUrge.showsUpAs);
        expect(personality.strengths).not.toEqual(lifePath.strengths);
        expect(personality.strengths).not.toEqual(destiny.strengths);
        expect(personality.strengths).not.toEqual(soulUrge.strengths);
      }
    });

    test('master numbers (11, 22, 33) remain distinct, not collapsed into their reduced digit', () => {
      const masterToReduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, reduced] of Object.entries(masterToReduced)) {
        const masterSection = getCoreNumberInterpretation('personality', Number(master));
        const reducedSection = getCoreNumberInterpretation('personality', reduced);
        expect(masterSection.yourInterpretation).not.toBe(reducedSection.yourInterpretation);
        expect(masterSection.yourInterpretation).toContain('master number');
      }
    });

    test('avoids deterministic/mystical wording', () => {
      const bannedPhrases = [
        'you are destined',
        'you will',
        'your mission is',
        'this guarantees',
        'you always',
        'you naturally',
        'you must',
        'this means you are',
        'this means you always',
        'you cannot',
      ];
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('personality', value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ]
          .join(' ')
          .toLowerCase();
        for (const phrase of bannedPhrases) {
          expect(allText).not.toContain(phrase);
        }
      }
    });

    test("WHAT THIS NUMBER REPRESENTS correctly explains Personality's own calculation and role", () => {
      const represents = getCoreNumberInterpretation('personality', 1).represents;
      expect(represents).toMatch(/outward impression/i);
      expect(represents).toMatch(/consonants/i);
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('personality', value).represents).toBe(represents);
      }
    });
  });

  describe('Destiny - rewritten with richer, Expression-focused content', () => {
    const DESTINY_SITUATIONAL_PATTERN =
      /\b(work|problem|leadership|communication|collaboration|responsibility|learning|decision|relationships?|creative|creativity|mentoring|group)\b/i;

    test('every value has non-empty content with the expected three-bullet shape', () => {
      const seen = new Set<string>();
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('destiny', value);
        expect(section.yourInterpretation.length).toBeGreaterThan(0);
        expect(section.showsUpAs).toHaveLength(3);
        expect(section.strengths).toHaveLength(3);
        expect(section.mindfulOf).toHaveLength(3);
        expect(section.howToUse.length).toBeGreaterThan(0);
        expect(seen.has(section.yourInterpretation)).toBe(false);
        seen.add(section.yourInterpretation);
      }
    });

    test('"Your Interpretation" is meaningfully richer than a single short sentence', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('destiny', value).yourInterpretation;
        const sentenceCount = (text.match(/[.!?](?:\s|$)/g) ?? []).length;
        expect(sentenceCount).toBeGreaterThanOrEqual(2);
        expect(text.length).toBeGreaterThan(120);
      }
    });

    test('uses reflective, non-deterministic language ("may" / "can" / "traditionally associated with")', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('destiny', value).yourInterpretation;
        expect(text).toMatch(/\b(may|can|often described as|traditionally associated with|traditionally considered)\b/i);
      }
    });

    test('"How It May Show Up" is concrete and situational (work, problem solving, communication, decision making, leadership, creativity, collaboration, learning, responsibility, or relationships)', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const showsUpAs = getCoreNumberInterpretation('destiny', value).showsUpAs;
        for (const bullet of showsUpAs) {
          expect(bullet).toMatch(DESTINY_SITUATIONAL_PATTERN);
        }
      }
    });

    test('does not simply reuse generic NUMBER_ESSENCE wording', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('destiny', value);
        const essenceThemes = NUMBER_ESSENCE[value].themes;
        for (const theme of essenceThemes) {
          expect(section.yourInterpretation).not.toContain(theme);
        }
      }
    });

    test('is category-specific - not identical to Life Path, Soul Urge or Personality content for the same value', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const destiny = getCoreNumberInterpretation('destiny', value);
        const lifePath = getCoreNumberInterpretation('lifePath', value);
        const soulUrge = getCoreNumberInterpretation('soulUrge', value);
        const personality = getCoreNumberInterpretation('personality', value);
        expect(destiny.yourInterpretation).not.toBe(lifePath.yourInterpretation);
        expect(destiny.yourInterpretation).not.toBe(soulUrge.yourInterpretation);
        expect(destiny.yourInterpretation).not.toBe(personality.yourInterpretation);
        expect(destiny.showsUpAs).not.toEqual(lifePath.showsUpAs);
        expect(destiny.showsUpAs).not.toEqual(soulUrge.showsUpAs);
        expect(destiny.showsUpAs).not.toEqual(personality.showsUpAs);
        expect(destiny.strengths).not.toEqual(lifePath.strengths);
        expect(destiny.strengths).not.toEqual(soulUrge.strengths);
        expect(destiny.strengths).not.toEqual(personality.strengths);
      }
    });

    test('master numbers (11, 22, 33) remain distinct, not collapsed into their reduced digit', () => {
      const masterToReduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, reduced] of Object.entries(masterToReduced)) {
        const masterSection = getCoreNumberInterpretation('destiny', Number(master));
        const reducedSection = getCoreNumberInterpretation('destiny', reduced);
        expect(masterSection.yourInterpretation).not.toBe(reducedSection.yourInterpretation);
        expect(masterSection.yourInterpretation).toContain('master number');
      }
    });

    test('avoids deterministic/mystical wording', () => {
      const bannedPhrases = [
        'your mission is',
        'you are destined to',
        'you were born to',
        'you will',
        'you are meant to',
        'you must',
        'this guarantees',
        'this means you will',
        'you always',
        'you naturally',
      ];
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('destiny', value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ]
          .join(' ')
          .toLowerCase();
        for (const phrase of bannedPhrases) {
          expect(allText).not.toContain(phrase);
        }
      }
    });

    test('no longer reuses the old, mission-style DESTINY_ARCHETYPES description verbatim', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('destiny', value).yourInterpretation).not.toBe(
          DESTINY_ARCHETYPES[value].description,
        );
      }
    });

    test("WHAT THIS NUMBER REPRESENTS correctly explains Destiny's own calculation and role", () => {
      const represents = getCoreNumberInterpretation('destiny', 1).represents;
      expect(represents).toMatch(/abilities and potential/i);
      expect(represents).toMatch(/every letter/i);
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('destiny', value).represents).toBe(represents);
      }
    });

    test('preserves the traditional theme already represented by DESTINY_ARCHETYPES for a sample of values', () => {
      expect(getCoreNumberInterpretation('destiny', 1).yourInterpretation).toMatch(/self-direct/i);
      expect(getCoreNumberInterpretation('destiny', 2).yourInterpretation).toMatch(/alignment/i);
      expect(getCoreNumberInterpretation('destiny', 8).yourInterpretation).toMatch(/resources/i);
      expect(getCoreNumberInterpretation('destiny', 9).yourInterpretation).toMatch(/wider|beyond/i);
      expect(getCoreNumberInterpretation('destiny', 22).yourInterpretation).toMatch(/vision/i);
    });
  });

  describe('Soul Urge - rewritten with richer, inner-motivation-focused content', () => {
    const SOUL_URGE_SITUATIONAL_PATTERN =
      /\b(personal choices?|work preferences?|relationships?|communication|free time|learning|goals?|responsibility|creativity|creative|helping others|independence|stability|stable)\b/i;

    test('every value has non-empty content with the expected three-bullet shape', () => {
      const seen = new Set<string>();
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('soulUrge', value);
        expect(section.yourInterpretation.length).toBeGreaterThan(0);
        expect(section.showsUpAs).toHaveLength(3);
        expect(section.strengths).toHaveLength(3);
        expect(section.mindfulOf).toHaveLength(3);
        expect(section.howToUse.length).toBeGreaterThan(0);
        expect(seen.has(section.yourInterpretation)).toBe(false);
        seen.add(section.yourInterpretation);
      }
    });

    test('"Your Interpretation" is meaningfully richer than a single short sentence', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('soulUrge', value).yourInterpretation;
        const sentenceCount = (text.match(/[.!?](?:\s|$)/g) ?? []).length;
        expect(sentenceCount).toBeGreaterThanOrEqual(2);
        expect(text.length).toBeGreaterThan(120);
      }
    });

    test('is specifically about inner motivation/values, not a generic description', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('soulUrge', value).yourInterpretation;
        expect(text).toMatch(/\b(inner pull|motivat|fulfil|satisf)/i);
      }
    });

    test('uses reflective, non-deterministic language ("may" / "can" / "traditionally associated with")', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const text = getCoreNumberInterpretation('soulUrge', value).yourInterpretation;
        expect(text).toMatch(/\b(may|can|often described as|traditionally associated with|traditionally considered)\b/i);
      }
    });

    test('"How It May Show Up" is concrete and situational (personal choices, work preferences, relationships, communication, free time, learning, goals, responsibility, creativity, helping others, independence, or stability)', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const showsUpAs = getCoreNumberInterpretation('soulUrge', value).showsUpAs;
        for (const bullet of showsUpAs) {
          expect(bullet).toMatch(SOUL_URGE_SITUATIONAL_PATTERN);
        }
      }
    });

    test('does not simply reuse generic NUMBER_ESSENCE wording', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('soulUrge', value);
        const essenceThemes = NUMBER_ESSENCE[value].themes;
        for (const theme of essenceThemes) {
          expect(section.yourInterpretation).not.toContain(theme);
        }
      }
    });

    test('is category-specific - not identical to Life Path, Destiny or Personality content for the same value', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        const soulUrge = getCoreNumberInterpretation('soulUrge', value);
        const lifePath = getCoreNumberInterpretation('lifePath', value);
        const destiny = getCoreNumberInterpretation('destiny', value);
        const personality = getCoreNumberInterpretation('personality', value);
        expect(soulUrge.yourInterpretation).not.toBe(lifePath.yourInterpretation);
        expect(soulUrge.yourInterpretation).not.toBe(destiny.yourInterpretation);
        expect(soulUrge.yourInterpretation).not.toBe(personality.yourInterpretation);
        expect(soulUrge.showsUpAs).not.toEqual(lifePath.showsUpAs);
        expect(soulUrge.showsUpAs).not.toEqual(destiny.showsUpAs);
        expect(soulUrge.showsUpAs).not.toEqual(personality.showsUpAs);
        expect(soulUrge.strengths).not.toEqual(lifePath.strengths);
        expect(soulUrge.strengths).not.toEqual(destiny.strengths);
        expect(soulUrge.strengths).not.toEqual(personality.strengths);
      }
    });

    test('master numbers (11, 22, 33) remain distinct, not collapsed into their reduced digit', () => {
      const masterToReduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, reduced] of Object.entries(masterToReduced)) {
        const masterSection = getCoreNumberInterpretation('soulUrge', Number(master));
        const reducedSection = getCoreNumberInterpretation('soulUrge', reduced);
        expect(masterSection.yourInterpretation).not.toBe(reducedSection.yourInterpretation);
        expect(masterSection.yourInterpretation).toContain('master number');
      }
    });

    test('avoids deterministic, mystical, or psychological-certainty wording', () => {
      const bannedPhrases = [
        'your soul is',
        'your soul needs',
        'your soul yearns',
        'your soul craves',
        'you are destined to',
        'you were born to',
        'you will',
        'you are meant to',
        'you must',
        'your mission is',
        'this proves',
        'this guarantees',
        'this always',
        'this never',
        'you always',
        'you naturally',
        'deep down you are',
        'your true self is',
      ];
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('soulUrge', value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ]
          .join(' ')
          .toLowerCase();
        for (const phrase of bannedPhrases) {
          expect(allText).not.toContain(phrase);
        }
      }
    });

    test('introduces no financial, relationship-guarantee, or healing/transformation claims', () => {
      const unsupportedClaimWords = [
        'financial',
        'money',
        'wealth',
        'healing',
        ' heal ',
        ' cure',
        'guaranteed income',
        'guaranteed relationship',
        'guaranteed success',
        'guaranteed transformation',
      ];
      for (const value of ALL_LIFE_PATH_VALUES) {
        const section = getCoreNumberInterpretation('soulUrge', value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ]
          .join(' ')
          .toLowerCase();
        for (const phrase of unsupportedClaimWords) {
          expect(allText).not.toContain(phrase);
        }
      }
    });

    test('no longer reuses the old, "soul yearns/craves" SOUL_URGE_ARCHETYPES description verbatim', () => {
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('soulUrge', value).yourInterpretation).not.toBe(
          SOUL_URGE_ARCHETYPES[value].description,
        );
      }
    });

    test("WHAT THIS NUMBER REPRESENTS correctly explains Soul Urge's own calculation and role", () => {
      const represents = getCoreNumberInterpretation('soulUrge', 1).represents;
      expect(represents).toMatch(/inner motivation/i);
      expect(represents).toMatch(/vowels/i);
      for (const value of ALL_LIFE_PATH_VALUES) {
        expect(getCoreNumberInterpretation('soulUrge', value).represents).toBe(represents);
      }
    });

    test('preserves the traditional theme already represented by SOUL_URGE_ARCHETYPES for a sample of values', () => {
      expect(getCoreNumberInterpretation('soulUrge', 1).yourInterpretation).toMatch(/autonomy|own/i);
      expect(getCoreNumberInterpretation('soulUrge', 4).yourInterpretation).toMatch(/order|stability|reliable/i);
      expect(getCoreNumberInterpretation('soulUrge', 6).yourInterpretation).toMatch(/care|harmony/i);
      expect(getCoreNumberInterpretation('soulUrge', 7).yourInterpretation).toMatch(/solitude/i);
      expect(getCoreNumberInterpretation('soulUrge', 9).yourInterpretation).toMatch(/compassion/i);
    });
  });

  describe('birthday - the one category whose canonical value is an unreduced 1-31 day', () => {
    test('a compound day (e.g. 17) is interpreted via its traditional single-digit reduction, and says so', () => {
      const section = getCoreNumberInterpretation('birthday', 17);
      expect(section.yourInterpretation).toContain('17');
      expect(section.yourInterpretation).toContain('reduces to 8');
    });

    test('a day that is already a single digit needs no reduction note', () => {
      const section = getCoreNumberInterpretation('birthday', 7);
      expect(section.yourInterpretation).not.toContain('reduces to');
    });

    test('day 11 and day 22 keep their master-number reading, consistent with the canonical reduceNumber() behavior', () => {
      const day11 = getCoreNumberInterpretation('birthday', 11);
      const day22 = getCoreNumberInterpretation('birthday', 22);
      expect(day11.yourInterpretation).not.toContain('reduces to');
      expect(day22.yourInterpretation).not.toContain('reduces to');
      expect(day11.showsUpAs.join(' ')).toContain('heightened intuition'.split(' ')[0]); // essence-derived, not generic
    });

    test('day 29 (sums to a master number 11) is interpreted as the master number, not digit 2', () => {
      const day29 = getCoreNumberInterpretation('birthday', 29);
      const day2 = getCoreNumberInterpretation('birthday', 2);
      expect(day29.yourInterpretation).toContain('reduces to 11');
      expect(day29.showsUpAs).not.toEqual(day2.showsUpAs);
    });

    test('day 25: the raw day and its reduction arithmetic are explained before the traditional meaning', () => {
      const section = getCoreNumberInterpretation('birthday', 25);
      const text = section.yourInterpretation;
      expect(text).toContain('Your birth day is 25');
      expect(text).toContain('2 + 5 = 7');
      expect(text).toContain('reduces to 7');

      // The raw-day/arithmetic sentence must come before the sentence
      // explaining what 7 traditionally means - never the reverse.
      const rawDayIndex = text.indexOf('Your birth day is 25');
      const meaningIndex = text.indexOf('traditionally associated with');
      expect(rawDayIndex).toBeGreaterThanOrEqual(0);
      expect(meaningIndex).toBeGreaterThan(rawDayIndex);
    });

    test('no longer uses "natural inclination toward/to" or other overly strong wording', () => {
      for (const value of [...SINGLE_DIGITS, ...MASTER_NUMBERS, 17, 25, 29]) {
        const text = getCoreNumberInterpretation('birthday', value).yourInterpretation;
        expect(text.toLowerCase()).not.toContain('natural inclination');
        expect(text).not.toMatch(/\byou are\b/i);
        expect(text).not.toMatch(/\byou will\b/i);
        expect(text).not.toMatch(/\byou must\b/i);
        expect(text).not.toMatch(/your destiny is/i);
      }
    });

    test('master days 11 and 22 are explicitly named as master days, not silently reduced', () => {
      expect(getCoreNumberInterpretation('birthday', 11).yourInterpretation).toContain('master day');
      expect(getCoreNumberInterpretation('birthday', 22).yourInterpretation).toContain('master day');
      expect(getCoreNumberInterpretation('birthday', 29).yourInterpretation).toContain('master day');
    });
  });

  test('no generated text uses deterministic, deficiency, or unsupported-claim language', () => {
    for (const key of CORE_KEYS) {
      for (const value of [...SINGLE_DIGITS, ...MASTER_NUMBERS, 17, 29]) {
        const section = getCoreNumberInterpretation(key, value);
        const allText = [
          section.represents,
          section.yourInterpretation,
          ...section.showsUpAs,
          ...section.strengths,
          ...section.mindfulOf,
          section.howToUse,
        ].join(' ');
        expect(allText).not.toMatch(BANNED_WORDS);
      }
    }
  });
});

describe('getCoreNumberSummary - now a genuine cross-number synthesis', () => {
  const PROFILE_A = fakeReport({ lifePath: 1, destiny: 1, soulUrge: 8, personality: 3, birthday: 5 });
  const PROFILE_B = fakeReport({ lifePath: 6, destiny: 4, soulUrge: 7, personality: 2, birthday: 9 });

  const SUMMARY_BANNED_PHRASES = [
    'you are destined to',
    'you will',
    'you were born to',
    'you are meant to',
    'your mission is',
    'you must',
    'this guarantees',
    'this proves',
    'you always',
    'you never',
    'you naturally',
    'your true self is',
    'your soul is',
    'your soul needs',
    'special powers',
    'guaranteed success',
    'spiritual superiority',
    'exceptional destiny',
    'guaranteed achievement',
    'number 1 is dominant',
    'controls your personality',
    'guarantees stronger',
  ];

  const NUMBER_CONFLICT_PATTERN = /\bconflicts? with\b|\bclash(es)?\b|\bopposes?\b|\bincompatible\b|\bcontradicts\b/i;

  test('1. synthesizes a non-empty paragraph referencing all five Core Numbers', () => {
    const summary = getCoreNumberSummary(fakeReport());
    expect(summary.paragraph.length).toBeGreaterThan(0);
    expect(summary.paragraph).toMatch(/Life Path/i);
    expect(summary.paragraph).toMatch(/Destiny/i);
    expect(summary.paragraph).toMatch(/Soul Urge/i);
    expect(summary.paragraph).toMatch(/Personality/i);
    expect(summary.paragraph).toMatch(/Birthday/i);
  });

  test('2-3. overarchingThemes has 1-3 deduplicated items', () => {
    const summary = getCoreNumberSummary(fakeReport());
    expect(summary.overarchingThemes.length).toBeGreaterThan(0);
    expect(summary.overarchingThemes.length).toBeLessThanOrEqual(3);
    expect(new Set(summary.overarchingThemes).size).toBe(summary.overarchingThemes.length);

    // All five Core Numbers sharing the same digit must collapse to one theme.
    const collapsed = getCoreNumberSummary(
      fakeReport({ lifePath: 1, destiny: 1, soulUrge: 1, personality: 1, birthday: 1 }),
    );
    expect(collapsed.overarchingThemes).toHaveLength(1);
  });

  test('4. paragraph is no longer merely the old fixed keyword template', () => {
    const summary = getCoreNumberSummary(fakeReport());
    expect(summary.paragraph).not.toMatch(/your life path points toward themes of/i);
    expect(summary.paragraph).not.toMatch(/taken together, these numbers traditionally point to overarching themes of/i);
    expect(summary.paragraph).not.toMatch(/your soul urge is motivated by/i);
  });

  test('5-9. does not reproduce any of the five full Core Number interpretations verbatim', () => {
    const summary = getCoreNumberSummary(fakeReport());
    expect(summary.paragraph).not.toContain(getCoreNumberInterpretation('lifePath', 1).yourInterpretation);
    expect(summary.paragraph).not.toContain(getCoreNumberInterpretation('destiny', 2).yourInterpretation);
    expect(summary.paragraph).not.toContain(getCoreNumberInterpretation('soulUrge', 3).yourInterpretation);
    expect(summary.paragraph).not.toContain(getCoreNumberInterpretation('personality', 4).yourInterpretation);
    expect(summary.paragraph).not.toContain(getCoreNumberInterpretation('birthday', 17).yourInterpretation);
  });

  test('10. changing a single Core Number changes the summary meaningfully', () => {
    const base = getCoreNumberSummary(fakeReport());
    const changedPersonality = getCoreNumberSummary(fakeReport({ personality: 9 }));
    expect(changedPersonality.paragraph).not.toBe(base.paragraph);
  });

  test('11-12. repeated-number detection works and stays reflective', () => {
    // Profile A: lifePath and destiny both resolve to 1.
    const summary = getCoreNumberSummary(PROFILE_A);
    expect(summary.paragraph).toMatch(/number 1/i);
    expect(summary.paragraph).toMatch(
      /appears in more than one part|is echoed across|shows up in several areas|creates a recurring theme/i,
    );
    const lower = summary.paragraph.toLowerCase();
    expect(lower).not.toContain('number 1 is dominant');
    expect(lower).not.toContain('controls your personality');
    expect(lower).not.toContain('guarantees stronger');
  });

  test('13-14. master-number presence is handled correctly and stays reflective', () => {
    const summary = getCoreNumberSummary(fakeReport({ lifePath: 11, destiny: 2, soulUrge: 3, personality: 4, birthday: 5 }));
    expect(summary.paragraph).toMatch(/master number/i);
    expect(summary.paragraph).toMatch(/distinct interpretive layer/i);

    // A profile with no master number must not mention one.
    const noMaster = getCoreNumberSummary(fakeReport({ lifePath: 2, destiny: 4, soulUrge: 6, personality: 8, birthday: 3 }));
    expect(noMaster.paragraph).not.toMatch(/master number/i);
  });

  test('15. different five-number combinations produce meaningfully different summaries', () => {
    const summaryA = getCoreNumberSummary(PROFILE_A);
    const summaryB = getCoreNumberSummary(PROFILE_B);
    expect(summaryA.paragraph).not.toBe(summaryB.paragraph);
    expect(summaryA.overarchingThemes).not.toEqual(summaryB.overarchingThemes);
  });

  test('16. deterministic/mystical/psychological-certainty banned phrases are absent', () => {
    const profiles = [
      fakeReport(),
      PROFILE_A,
      PROFILE_B,
      fakeReport({ lifePath: 33, destiny: 22, soulUrge: 11, personality: 7, birthday: 25 }),
    ];
    for (const profile of profiles) {
      const lower = getCoreNumberSummary(profile).paragraph.toLowerCase();
      for (const phrase of SUMMARY_BANNED_PHRASES) {
        expect(lower).not.toContain(phrase);
      }
    }
  });

  test('17&19. summary stays within a reasonable, mobile-friendly length', () => {
    const profiles = [
      fakeReport(),
      PROFILE_A,
      PROFILE_B,
      // Worst case: a repeated digit AND a master number present together.
      fakeReport({ lifePath: 11, destiny: 11, soulUrge: 3, personality: 4, birthday: 5 }),
    ];
    for (const profile of profiles) {
      const { paragraph } = getCoreNumberSummary(profile);
      expect(paragraph.length).toBeLessThanOrEqual(1500);
      const sentenceCount = (paragraph.match(/[.!?](?:\s|$)/g) ?? []).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(3);
      expect(sentenceCount).toBeLessThanOrEqual(7);
    }
  });

  test('18. Birthday compound values such as 25 continue to work (via the existing reduction, not as a raw digit)', () => {
    const summary = getCoreNumberSummary(fakeReport({ birthday: 25 }));
    expect(summary.paragraph.length).toBeGreaterThan(0);
    // 25 reduces to 7 ("quiet reflection...") via the existing, untouched reduction logic.
    expect(summary.paragraph).toMatch(/quiet reflection/i);
  });

  test('20. summary remains non-empty for both ordinary and master-number profiles', () => {
    const ordinary = getCoreNumberSummary(fakeReport());
    const master = getCoreNumberSummary(fakeReport({ lifePath: 33, destiny: 22, soulUrge: 11 }));
    expect(ordinary.paragraph.length).toBeGreaterThan(0);
    expect(ordinary.overarchingThemes.length).toBeGreaterThan(0);
    expect(master.paragraph.length).toBeGreaterThan(0);
    expect(master.overarchingThemes.length).toBeGreaterThan(0);
  });

  test('19. unsupported number-conflict claims are not generated', () => {
    const profiles = [fakeReport(), PROFILE_A, PROFILE_B, fakeReport({ lifePath: 6, destiny: 1 })];
    for (const profile of profiles) {
      expect(getCoreNumberSummary(profile).paragraph).not.toMatch(NUMBER_CONFLICT_PATTERN);
    }
  });

  test('personalization: a repeated Number 1 (Life Path & Destiny) is recognized', () => {
    const summary = getCoreNumberSummary(fakeReport({ lifePath: 1, destiny: 1 }));
    expect(summary.paragraph).toMatch(/number 1/i);
    expect(summary.paragraph).toMatch(/life path/i);
    expect(summary.paragraph).toMatch(/destiny/i);
  });
});
