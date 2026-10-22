/**
 * Concise, reflective content for the onboarding Core Identity screen
 * (app/onboarding/blueprint-result.tsx) - a short first introduction to
 * Life Path, Destiny, and Soul Urge. Deliberately separate from
 * `coreNumberContent.ts`, which remains the single source of truth for the
 * detailed Blueprint tab; this file must never feed that screen, and
 * `coreNumberContent.ts` must never be shortened to feed this one.
 */

export interface CoreIdentitySection {
  shortInterpretation: string;
  youMayNotice: string;
}

export type CoreIdentityKey = 'lifePath' | 'destiny' | 'soulUrge';

const LIFE_PATH_IDENTITY: Record<number, CoreIdentitySection> = {
  1: {
    shortInterpretation:
      "Life Path 1 centers on independence and a readiness to lead, often feeling most at ease steering your own course rather than following someone else's.",
    youMayNotice: 'You may speak up first, start things yourself, and act on ideas quickly.',
  },
  2: {
    shortInterpretation:
      'Life Path 2 is about cooperation and sensing how others feel, often preferring to work alongside someone rather than handle things alone.',
    youMayNotice: 'You may be the one others turn to, quietly easing tension and preferring shared decisions.',
  },
  3: {
    shortInterpretation:
      'Life Path 3 centers on self-expression and creativity, often bringing a sense of fun or lightness to situations that could otherwise feel heavy.',
    youMayNotice: 'You may lift the mood in a room and turn thoughts or feelings into words or ideas quickly.',
  },
  4: {
    shortInterpretation:
      'Life Path 4 is about practicality and building things step by step, often favoring a clear plan and taking responsibility seriously.',
    youMayNotice: 'You may break big tasks into steps and look for practical fixes rather than giving up.',
  },
  5: {
    shortInterpretation:
      'Life Path 5 centers on variety and adapting easily to change, often feeling restless when life gets too predictable or routine.',
    youMayNotice: 'You may get bored with routine and adjust easily when plans suddenly shift.',
  },
  6: {
    shortInterpretation:
      'Life Path 6 is about care and responsibility for those close to you, often noticing when someone needs help before they ask.',
    youMayNotice: 'You may be the one family and friends turn to when something needs sorting out.',
  },
  7: {
    shortInterpretation:
      'Life Path 7 centers on reflection and a deeper search for understanding, often preferring to think things through alone before discussing them.',
    youMayNotice: 'You may need quiet time to process and notice details that others tend to miss.',
  },
  8: {
    shortInterpretation:
      'Life Path 8 is about ambition and practical results, often feeling most motivated with a clear goal and comfortable taking charge.',
    youMayNotice: "You may feel restless until there's visible progress, and judge things by actual results.",
  },
  9: {
    shortInterpretation:
      'Life Path 9 centers on compassion and a broad view of life, often carrying a quiet need to bring things to a proper close.',
    youMayNotice: 'You may feel for people you barely know and find it hard to leave things unresolved.',
  },
  11: {
    shortInterpretation:
      'Life Path 11 is a master number centered on heightened intuition, often picking up on things before being able to explain why.',
    youMayNotice: 'You may get a strong gut feeling about people, and inspire others without quite trying.',
  },
  22: {
    shortInterpretation:
      'Life Path 22 is a master number about turning a big vision into something real and lasting, often favoring ambitious long-term projects.',
    youMayNotice: 'You may plan years ahead and pair a bigger vision with practical, steady steps.',
  },
  33: {
    shortInterpretation:
      'Life Path 33 is a master number centered on deep compassion, often carrying a strong sense of responsibility for those around you.',
    youMayNotice: 'You may be the one people turn to in hard times, feeling their emotions almost as your own.',
  },
};

const DESTINY_IDENTITY: Record<number, CoreIdentitySection> = {
  1: {
    shortInterpretation:
      'Destiny 1 is traditionally associated with self-direction and original thinking, often favoring your own solution to a problem and starting something new rather than maintaining what already exists.',
    youMayNotice: 'You may volunteer to lead new initiatives and set a clear direction for others to follow.',
  },
  2: {
    shortInterpretation:
      'Destiny 2 is traditionally associated with bringing people and perspectives into alignment, and people with this number may act as a steadying presence whenever real disagreement arises.',
    youMayNotice: 'You may find compromises everyone accepts and quietly make sure every voice gets heard.',
  },
  3: {
    shortInterpretation:
      'Destiny 3 is traditionally associated with creativity and the way ideas are put into words, and people with this number may often be the ones who help an idea land.',
    youMayNotice: 'You may be asked to present because your version is easier to follow and more engaging.',
  },
  4: {
    shortInterpretation:
      'Destiny 4 is traditionally associated with building durable, dependable systems, often through the practical, unglamorous work of making things reliable and built to last.',
    youMayNotice: 'You may document a process so it keeps working, and prefer a thorough, step-by-step approach.',
  },
  5: {
    shortInterpretation:
      'Destiny 5 is traditionally associated with flexibility and guiding others through transitions, and people with this number may make a shift feel less disruptive for everyone involved.',
    youMayNotice: 'You may pick up new tools quickly and keep morale up during real uncertainty.',
  },
  6: {
    shortInterpretation:
      "Destiny 6 is traditionally associated with care and a sense of duty toward others, often showing up in roles where someone's wellbeing is part of the work itself.",
    youMayNotice: 'You may naturally take on the parts of a project that involve looking after people.',
  },
  7: {
    shortInterpretation:
      'Destiny 7 is traditionally associated with careful reasoning and depth of understanding, often suited to work that rewards sitting with a problem rather than rushing past it.',
    youMayNotice: 'You may catch flaws others approved too quickly and prefer understanding a cause before fixing it.',
  },
  8: {
    shortInterpretation:
      'Destiny 8 is traditionally associated with practical ambition and the responsible use of resources, and people with this number may turn a plan into something that actually happens.',
    youMayNotice: 'You may translate a strategy into a workable plan and weigh practical costs before committing.',
  },
  9: {
    shortInterpretation:
      "Destiny 9 is traditionally associated with a wider sense of contribution beyond your immediate circle, and people with this number may consider how their work affects those they'll never meet.",
    youMayNotice: 'You may ask how a decision affects outsiders and advocate for what benefits the wider group.',
  },
  11: {
    shortInterpretation:
      'Destiny 11 is a master number traditionally associated with insight that bridges intuition and practical impact, and people with this number may change how a group sees a situation.',
    youMayNotice: 'You may raise a point that reframes a discussion and inspire others simply through example.',
  },
  22: {
    shortInterpretation:
      'Destiny 22 is a master number traditionally associated with turning an ambitious vision into something practically real, often associated with taking on responsibilities bigger than usual.',
    youMayNotice: 'You may think in years rather than weeks and turn shared ambition into an actual plan.',
  },
  33: {
    shortInterpretation:
      "Destiny 33 is a master number traditionally associated with care and service on a wider scale, where one's presence itself may tend to help others.",
    youMayNotice: 'You may be the person colleagues seek out for genuine support, not just advice.',
  },
};

const SOUL_URGE_IDENTITY: Record<number, CoreIdentitySection> = {
  1: {
    shortInterpretation:
      'Soul Urge 1 carries an inner pull toward autonomy and originality, feeling most satisfied when a choice or idea is genuinely your own.',
    youMayNotice: 'You may feel more fulfilled picking your own path and wanting real ownership over your work.',
  },
  2: {
    shortInterpretation:
      'Soul Urge 2 carries an inner pull toward closeness and emotional safety, feeling most fulfilled where trust has been quietly built over time.',
    youMayNotice: 'You may feel most content with a small circle of people you deeply trust.',
  },
  3: {
    shortInterpretation:
      'Soul Urge 3 carries an inner pull toward creativity and shared joy, feeling most fulfilled when self-expression is genuinely shared with others.',
    youMayNotice: 'You may be drawn to creative outlets and feel most connected through laughter and playfulness.',
  },
  4: {
    shortInterpretation:
      'Soul Urge 4 carries an inner pull toward order and dependable stability, feeling most satisfied when the plan is clear and reliable.',
    youMayNotice: 'You may choose the proven, consistent option and value people who follow through.',
  },
  5: {
    shortInterpretation:
      "Soul Urge 5 carries an inner pull toward freedom and variety, feeling most fulfilled when there's genuine room to shift direction.",
    youMayNotice: 'You may seek new experiences often and feel engaged by a role that varies day to day.',
  },
  6: {
    shortInterpretation:
      'Soul Urge 6 carries an inner pull toward care and harmony in close relationships, feeling most fulfilled when loved ones feel looked after.',
    youMayNotice: 'You may naturally take on a caretaking role and weigh choices by how they affect others.',
  },
  7: {
    shortInterpretation:
      'Soul Urge 7 carries an inner pull toward solitude and understanding, feeling most fulfilled with uninterrupted time to think things through alone.',
    youMayNotice: 'You may be drawn to quiet, solitary activities and prefer going deep on one subject.',
  },
  8: {
    shortInterpretation:
      'Soul Urge 8 carries an inner pull toward recognition for genuine capability, feeling most fulfilled when your own effort is visibly acknowledged.',
    youMayNotice: 'You may set goals you can point to as your own and value clear personal credit.',
  },
  9: {
    shortInterpretation:
      "Soul Urge 9 carries an inner pull toward compassion and contribution beyond yourself, feeling most fulfilled easing things for people you'll never meet.",
    youMayNotice: 'You may feel most satisfied contributing to a cause larger than your own circle.',
  },
  11: {
    shortInterpretation:
      'Soul Urge 11 is a master number carrying a pull toward meaning beyond the everyday, feeling most fulfilled when something feels genuinely significant.',
    youMayNotice: 'You may trust an instinct before you can explain it and seek genuinely meaningful connection.',
  },
  22: {
    shortInterpretation:
      'Soul Urge 22 is a master number carrying a pull toward building something lasting, feeling most fulfilled when effort will genuinely outlast the moment.',
    youMayNotice: 'You may pursue ambitious, years-long goals and value real, tangible impact over quick wins.',
  },
  33: {
    shortInterpretation:
      'Soul Urge 33 is a master number carrying a pull toward caring for others widely, feeling most fulfilled offering genuine support to those struggling.',
    youMayNotice: 'You may end up supporting whoever in a group needs it most, quietly and often.',
  },
};

const TABLES: Record<CoreIdentityKey, Record<number, CoreIdentitySection>> = {
  lifePath: LIFE_PATH_IDENTITY,
  destiny: DESTINY_IDENTITY,
  soulUrge: SOUL_URGE_IDENTITY,
};

/**
 * Resolves the concise Core Identity content for one category/value.
 * `value` is whatever `buildNumerologyReport()` already calculated (e.g.
 * `report.lifePath`) - always one of 1-9, 11, 22, 33 for these three
 * categories, so the `?? table[9]` fallback only guards against an
 * unexpected value rather than performing any real reduction.
 */
export function getCoreIdentitySection(key: CoreIdentityKey, value: number): CoreIdentitySection {
  const table = TABLES[key];
  return table[value] ?? table[9];
}
