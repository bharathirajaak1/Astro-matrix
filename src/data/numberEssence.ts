/**
 * Shared, category-agnostic trait data for every number a Core Number can
 * resolve to (1-9 and the master numbers 11, 22, 33).
 *
 * This is the single factual source every Core Number category (Life Path,
 * Destiny, Soul Urge, Personality, Birthday) draws from - each category
 * reframes the same underlying themes through its own lens (see
 * `src/data/coreNumberContent.ts`), rather than five separate copies of this
 * content drifting apart over time. "Calculate once -> explain once ->
 * reuse everywhere."
 *
 * Content only - no logic, no calculation. Traditional/reflection-oriented
 * framing throughout: these are themes "traditionally associated with" a
 * number, not claims about a person. No deficiency language ("weak", "bad",
 * "doomed") and no deterministic claims (guarantees, health, finances).
 */

export interface NumberEssence {
  /** A single short word/phrase capturing this number's traditional theme. */
  keyword: string;
  /** 2-3 short noun phrases - the core traditional associations. */
  themes: string[];
  /** 2-3 short strength phrases. */
  strengths: string[];
  /** 1-2 gentle, tendency-framed (never deficiency-framed) things to notice. */
  mindfulOf: string[];
}

export const NUMBER_ESSENCE: Record<number, NumberEssence> = {
  1: {
    keyword: 'Initiative',
    themes: ['independence', 'starting new things', 'decisive action'],
    strengths: [
      'confidence to take the first step',
      'a clear sense of direction',
      'comfort making decisions quickly',
    ],
    mindfulOf: [
      'may prefer to go it alone even when support is available',
      'can feel restless when progress feels slow',
    ],
  },
  2: {
    keyword: 'Partnership',
    themes: ['cooperation', 'sensitivity to others', 'quiet diplomacy'],
    strengths: [
      'an instinct for reading a room',
      'patience in building trust',
      'a steady, calming presence',
    ],
    mindfulOf: [
      "may hold back a personal opinion to keep the peace",
      "can take other people's moods personally",
    ],
  },
  3: {
    keyword: 'Expression',
    themes: ['creative expression', 'communication', 'social warmth'],
    strengths: [
      'natural ease putting ideas into words',
      'an optimistic outlook',
      'a gift for lifting the mood of a room',
    ],
    mindfulOf: [
      'can scatter energy across too many ideas at once',
      'may stay upbeat rather than sit with a difficult feeling',
    ],
  },
  4: {
    keyword: 'Structure',
    themes: ['steady building', 'discipline', 'reliability'],
    strengths: [
      'a methodical, practical approach',
      'follow-through once committed',
      'a dependable presence for others',
    ],
    mindfulOf: [
      'may resist a plan changing once it is set',
      'can take on more responsibility than feels sustainable',
    ],
  },
  5: {
    keyword: 'Freedom',
    themes: ['change', 'curiosity', 'adaptability'],
    strengths: [
      'comfort with new situations',
      'a wide range of interests',
      'quick adjustment when plans shift',
    ],
    mindfulOf: [
      'may lose interest before something is finished',
      'can feel confined by routine even when it would help',
    ],
  },
  6: {
    keyword: 'Care',
    themes: ['responsibility', 'nurturing others', 'a sense of home'],
    strengths: [
      'genuine warmth toward people close to you',
      'a willingness to step in and help',
      'an eye for what a space or situation needs',
    ],
    mindfulOf: [
      "may take on others' concerns as your own",
      'can set your own needs aside while looking after everyone else',
    ],
  },
  7: {
    keyword: 'Introspection',
    themes: ['analysis', 'inner reflection', 'a search for understanding'],
    strengths: [
      'a thoughtful, probing mind',
      'comfort with solitude',
      'a knack for seeing beneath the surface of things',
    ],
    mindfulOf: [
      'may keep others at a distance while processing something internally',
      'can overthink a decision rather than act on instinct',
    ],
  },
  8: {
    keyword: 'Ambition',
    themes: ['organisation', 'drive toward goals', 'practical authority'],
    strengths: [
      'a strong sense of what you are working toward',
      'comfort taking charge of a situation',
      'persistence when something matters to you',
    ],
    mindfulOf: [
      'may measure progress mainly through visible results',
      'can take on too much at once in pursuit of a goal',
    ],
  },
  9: {
    keyword: 'Compassion',
    themes: ['a wide view of situations', 'empathy', 'completing what has been started'],
    strengths: [
      'an ability to see more than one side of a situation',
      'genuine concern for people beyond your immediate circle',
      'comfort bringing something to a close',
    ],
    mindfulOf: [
      'may find it hard to let go of a cause or a person',
      'can give generously to the point of leaving little for yourself',
    ],
  },
  11: {
    keyword: 'Illumination',
    themes: ['heightened intuition', 'inspiration', 'sensitivity to subtle cues'],
    strengths: [
      'a strong instinct that often turns out to be right',
      'the ability to inspire the people around you',
      'openness to ideas others might overlook',
    ],
    mindfulOf: [
      'intuition this strong can also bring heightened nervous energy',
      'may feel pressure to live up to a sense of potential',
    ],
  },
  22: {
    keyword: 'Master Building',
    themes: ['vision paired with practical follow-through', 'turning ideas into something real', 'long-term building'],
    strengths: [
      'the rare combination of big-picture thinking and practical execution',
      'patience for projects that take years to complete',
      'a steady hand under pressure',
    ],
    mindfulOf: [
      'may feel daunted by the scale of what you can see is possible',
      'can set a standard for yourself that is hard to sustain',
    ],
  },
  33: {
    keyword: 'Universal Teaching',
    themes: ['devoted service to others', 'compassion at a wide scale', 'teaching through example'],
    strengths: [
      'a natural pull toward helping others grow',
      'deep empathy',
      'the ability to hold space for people going through difficulty',
    ],
    mindfulOf: [
      'may carry the emotional weight of people you are supporting',
      'can lose track of your own needs while focused on others',
    ],
  },
};
