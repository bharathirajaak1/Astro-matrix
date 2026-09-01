/**
 * Remedy content: what to practise when a Lo Shu number is missing, and how to
 * align with a given Life Path. Content only - gating and persistence live in
 * `src/features/entitlements/`. Pure TypeScript, zero dependencies.
 */
import type { CoreNumber, Digit } from '@/core/types';

export interface Remedy {
  title: string;
  detail: string;
}

export interface MissingNumberRemedy {
  number: Digit;
  /** The quality this number governs. */
  theme: string;
  /** What an absent number tends to show up as. */
  meaning: string;
  /** Concrete practices to strengthen it. */
  remedies: Remedy[];
  /** A supportive colour to bring into daily life. */
  focusColor: string;
  affirmation: string;
}

export interface LifePathAlignment {
  lifePath: CoreNumber;
  /** The gift of this path when it flows well. */
  strength: string;
  /** How the same energy looks when it is over- or under-expressed. */
  imbalance: string;
  /** Practices that bring the path back into balance. */
  alignment: Remedy[];
}

// ---------------------------------------------------------------------------
// Missing Lo Shu numbers (1-9)
// ---------------------------------------------------------------------------

export const MISSING_NUMBER_REMEDIES: Record<Digit, MissingNumberRemedy> = {
  1: {
    number: 1,
    theme: 'Individuality & self-assertion',
    meaning:
      'A missing 1 often shows up as difficulty asserting yourself, speaking first, or standing apart from the group.',
    focusColor: '#C1443B',
    affirmation: 'I am allowed to want what I want, and to say so.',
    remedies: [
      {
        title: 'Morning declaration',
        detail: 'Before you touch your phone, say one intention aloud in the first person.',
      },
      {
        title: 'A solo hour',
        detail: 'Once a week, spend an hour doing something entirely alone and entirely your choice.',
      },
      {
        title: 'Lead one small thing',
        detail: 'Make one decision a day without waiting for consensus, however minor.',
      },
      {
        title: 'A red anchor',
        detail: 'Keep a small red object where you work as a cue to step forward.',
      },
    ],
  },
  2: {
    number: 2,
    theme: 'Sensitivity & partnership',
    meaning:
      'A missing 2 can look like bluntness, impatience with other people’s feelings, or trouble reading a room.',
    focusColor: '#7FA8C9',
    affirmation: 'I can be strong and gentle at the same time.',
    remedies: [
      {
        title: 'The two-breath pause',
        detail: 'In any disagreement, take two slow breaths before you reply.',
      },
      {
        title: 'A real check-in',
        detail: 'Ask one person "how are you, really?" each week and only listen.',
      },
      {
        title: 'Do it in pairs',
        detail: 'Cook, walk, or plan something with another person rather than alone.',
      },
      {
        title: 'Something silver',
        detail: 'Carry or wear something silver; sit with moonlight once a month.',
      },
    ],
  },
  3: {
    number: 3,
    theme: 'Expression & imagination',
    meaning:
      'A missing 3 often means self-criticism about creativity, holding words back, or trouble letting yourself play.',
    focusColor: '#E5B70B',
    affirmation: 'My voice is worth hearing before it is perfect.',
    remedies: [
      {
        title: 'Three lines a day',
        detail: 'Write three unedited sentences daily - a note, a joke, a description.',
      },
      {
        title: 'Say it first',
        detail: 'Once a day, share an idea before it feels finished.',
      },
      {
        title: 'Colour and sound',
        detail: 'Add yellow to your space; play music that makes you move.',
      },
      {
        title: 'A real play date',
        detail: 'Schedule genuinely purposeless fun once a week and keep the appointment.',
      },
    ],
  },
  4: {
    number: 4,
    theme: 'Structure & discipline',
    meaning:
      'A missing 4 can show as disorganisation, unfinished projects, shaky routines, or feeling ungrounded.',
    focusColor: '#3E7C4A',
    affirmation: 'Small, steady steps build something that lasts.',
    remedies: [
      {
        title: 'One brick daily',
        detail: 'Finish one small task completely before you start anything new.',
      },
      {
        title: 'Fixed anchors',
        detail: 'Hold the same wake time and one daily ritual for thirty days.',
      },
      {
        title: 'Earth contact',
        detail: 'Stand barefoot on the ground for a few minutes; tend a plant.',
      },
      {
        title: 'A squared notebook',
        detail: 'Keep one tidy grid notebook for plans; add green to your workspace.',
      },
    ],
  },
  5: {
    number: 5,
    theme: 'Freedom & adaptability',
    meaning:
      'A missing 5 often looks like fear of change, rigid habits, restlessness without action, or discomfort in the body.',
    focusColor: '#2FB6A8',
    affirmation: 'Change is how life keeps me awake.',
    remedies: [
      {
        title: 'Change one thing',
        detail: 'Alter a single routine each week - your route, a meal, the order of tasks.',
      },
      {
        title: 'Move daily',
        detail: 'Twenty minutes of varied movement, not the same workout each time.',
      },
      {
        title: 'Yes to the invitation',
        detail: 'Accept one unplanned invitation a month.',
      },
      {
        title: 'A senses walk',
        detail: 'Walk somewhere new and name five things for each sense.',
      },
    ],
  },
  6: {
    number: 6,
    theme: 'Care & responsibility',
    meaning:
      'A missing 6 can mean avoiding commitment at home, neglecting relationships or order, and giving too much or too little.',
    focusColor: '#4C5BD4',
    affirmation: 'Caring for what is mine is not a burden.',
    remedies: [
      {
        title: 'One act of service',
        detail: 'Do one small unasked thing for your household every day.',
      },
      {
        title: 'Tend one room',
        detail: 'Spend fifteen minutes making a single room calmer each week.',
      },
      {
        title: 'Bring beauty in',
        detail: 'Put flowers or fresh food in the house.',
      },
      {
        title: 'Say the caring thing',
        detail: 'Tell someone specifically what you appreciate about them.',
      },
    ],
  },
  7: {
    number: 7,
    theme: 'Reflection & inner life',
    meaning:
      'A missing 7 often shows as constant busyness, discomfort with silence, skimming instead of studying, and thin self-trust.',
    focusColor: '#7A4CC0',
    affirmation: 'Stillness is where my answers come from.',
    remedies: [
      {
        title: 'Ten quiet minutes',
        detail: 'Sit daily with no input - no phone, no music.',
      },
      {
        title: 'Study one thing',
        detail: 'Read deeply on a single subject for a month rather than skimming ten.',
      },
      {
        title: 'Time near water',
        detail: 'Sit by water when you can; use violet in a corner where you rest.',
      },
      {
        title: 'A question journal',
        detail: 'Each night, write the question you are actually sitting with.',
      },
    ],
  },
  8: {
    number: 8,
    theme: 'Authority & material mastery',
    meaning:
      'A missing 8 can look like money avoidance, discomfort with power, undercharging, or trouble finishing what pays.',
    focusColor: '#2B3A55',
    affirmation: 'I can hold money and power without losing myself.',
    remedies: [
      {
        title: 'A weekly money date',
        detail: 'Look at your numbers for fifteen minutes without flinching.',
      },
      {
        title: 'Ask for the full price',
        detail: 'Name your rate or your need once, without softening it.',
      },
      {
        title: 'Close the loop',
        detail: 'Finish one income-producing task before starting another.',
      },
      {
        title: 'Order and dark blue',
        detail: 'Declutter one drawer; carry or wear something black or navy.',
      },
    ],
  },
  9: {
    number: 9,
    theme: 'Compassion & completion',
    meaning:
      'A missing 9 often means trouble letting go, holding grudges, tunnel vision, or difficulty finishing chapters.',
    focusColor: '#B8791F',
    affirmation: 'Letting go makes room for what is next.',
    remedies: [
      {
        title: 'One ending a week',
        detail: 'Close, give away, or forgive one small thing.',
      },
      {
        title: 'Give without return',
        detail: 'Do one weekly act of generosity that no one repays.',
      },
      {
        title: 'Widen the view',
        detail: 'Read or watch something from a life very unlike your own.',
      },
      {
        title: 'A release ritual',
        detail: 'Write what you are ready to release, then safely burn or bin it.',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Life Path alignments (1-9, 11, 22, 33)
// ---------------------------------------------------------------------------

export const LIFE_PATH_ALIGNMENTS: Record<number, LifePathAlignment> = {
  1: {
    lifePath: 1,
    strength: 'Leadership, originality, and the courage to begin.',
    imbalance: 'Domineering, isolated, and impatient - or frozen by a fear of not being first.',
    alignment: [
      { title: 'Lead, then share it', detail: 'Lead one small thing this week and let others shape it.' },
      { title: 'Force or patience?', detail: 'When you feel the urge to push, ask once which actually serves the goal.' },
      { title: 'Start the circled thing', detail: 'Initiative is your medicine - begin one project you keep orbiting.' },
    ],
  },
  2: {
    lifePath: 2,
    strength: 'Diplomacy, sensitivity, partnership, and patience.',
    imbalance: 'Self-erasure, quiet resentment, indecision, and conflict avoidance.',
    alignment: [
      { title: 'State one preference', detail: 'Say what you want plainly once a day, without apologising for it.' },
      { title: 'Let the hard talk breathe', detail: 'Give a difficult conversation the time it needs instead of smoothing it over.' },
      { title: 'Choose the team', detail: 'Collaborate on one task you would normally carry alone.' },
    ],
  },
  3: {
    lifePath: 3,
    strength: 'Expression, optimism, creativity, and social warmth.',
    imbalance: 'Scattered energy, surface-skimming, gossip, and creative self-sabotage.',
    alignment: [
      { title: 'Finish to "shared"', detail: 'Take one creative thing all the way to shared, not just started.' },
      { title: 'Pick depth once', detail: 'Choose one real conversation over three shallow ones each day.' },
      { title: 'Make, don’t narrate', detail: 'Turn restlessness into something built rather than talked about.' },
    ],
  },
  4: {
    lifePath: 4,
    strength: 'Reliability, method, endurance, and honest work.',
    imbalance: 'Rigidity, stubbornness, overwork, and resistance to any change.',
    alignment: [
      { title: 'Leave a gap', detail: 'Keep one thing deliberately unplanned each week.' },
      { title: 'Question the rule', detail: 'Ask whether a rule you are defending still serves you.' },
      { title: 'Rest on schedule', detail: 'Book rest with the same seriousness you book work.' },
    ],
  },
  5: {
    lifePath: 5,
    strength: 'Adaptability, curiosity, freedom, and persuasion.',
    imbalance: 'Restlessness, over-indulgence, unreliability, and fear of commitment.',
    alignment: [
      { title: 'Keep one promise exactly', detail: 'Honour a single commitment this week for its own sake.' },
      { title: 'Finish before the new', detail: 'Complete the last thing before you say yes to the next.' },
      { title: 'One honest experiment', detail: 'Channel the craving for change into one experiment, not five distractions.' },
    ],
  },
  6: {
    lifePath: 6,
    strength: 'Responsibility, care, harmony, and service.',
    imbalance: 'Over-giving, control disguised as help, martyrdom, and perfectionism.',
    alignment: [
      { title: 'Serve, then stop', detail: 'Do one act of service and notice the urge to keep rescuing.' },
      { title: 'Let it be their way', detail: 'Allow someone to do a task imperfectly, their own way.' },
      { title: 'Your own standard', detail: 'Care for yourself to the standard you hold for everyone else.' },
    ],
  },
  7: {
    lifePath: 7,
    strength: 'Insight, analysis, depth, and spiritual seeking.',
    imbalance: 'Isolation, cynicism, over-thinking, secrecy, and avoidance of feeling.',
    alignment: [
      { title: 'Share the half-thought', detail: 'Tell one trusted person an idea before it is fully formed.' },
      { title: 'Go deep for a month', detail: 'Study one question thoroughly instead of skimming ten.' },
      { title: 'Feel it first', detail: 'Let one feeling be felt before you analyse it.' },
    ],
  },
  8: {
    lifePath: 8,
    strength: 'Ambition, executive skill, resilience, and material competence.',
    imbalance: 'Workaholism, control, status-hunger, and money anxiety.',
    alignment: [
      { title: 'Name your worth', detail: 'State your value once this week without discounting it.' },
      { title: 'Face the numbers calmly', detail: 'Look at your finances for fifteen minutes instead of avoiding them.' },
      { title: 'Lift someone with it', detail: 'Use your authority to raise another person, not only to win.' },
    ],
  },
  9: {
    lifePath: 9,
    strength: 'Compassion, vision, generosity, and the long view.',
    imbalance: 'Emotional overwhelm, self-neglect, a saviour complex, and trouble ending things.',
    alignment: [
      { title: 'Close one chapter', detail: 'Complete or release one lingering thing this week.' },
      { title: 'No scorekeeping', detail: 'Give without tracking it - and receive without deflecting.' },
      { title: 'Zoom out', detail: 'Step back to the wider view when a grievance has you stuck.' },
    ],
  },
  11: {
    lifePath: 11,
    strength: 'Intuition, inspiration, spiritual sensitivity, and the power to uplift.',
    imbalance: 'Nervous tension, self-doubt, overwhelm, and escapism - feeling "too much" or not enough.',
    alignment: [
      { title: 'Ground the vision', detail: 'Turn one intuition into one concrete next step.' },
      { title: 'Protect the nervous system', detail: 'Guard regular quiet, less noise, and real sleep.' },
      { title: 'Trust the first knowing', detail: 'Act on the quiet first signal before the second-guessing starts.' },
    ],
  },
  22: {
    lifePath: 22,
    strength: 'The master builder: a large vision made practical, in service of many.',
    imbalance: 'Crushing pressure, grandiosity or its opposite (playing small), and burnout.',
    alignment: [
      { title: 'Plan with dates', detail: 'Break the big vision into a dated plan and work the first line.' },
      { title: 'Let others carry parts', detail: 'A 22 is built with people - hand over real pieces.' },
      { title: 'Count the bricks', detail: 'Measure progress in work done, not in the size of the dream.' },
    ],
  },
  33: {
    lifePath: 33,
    strength: 'The master teacher: devoted service, a healing presence, unconditional care.',
    imbalance: 'Self-sacrifice to depletion, absorbing others’ pain, and neglecting your own needs.',
    alignment: [
      { title: 'Serve from overflow', detail: 'Fill your own cup first, on purpose, before giving.' },
      { title: 'Teach by example', detail: 'Show more than you instruct.' },
      { title: 'Put the burden down', detail: 'Release one weight that was never yours to carry.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function remedyForMissingNumber(n: Digit): MissingNumberRemedy {
  const entry = MISSING_NUMBER_REMEDIES[n];
  if (!entry) {
    throw new RangeError(`remedyForMissingNumber: expected a digit 1-9, got ${n}`);
  }
  return entry;
}

export function alignmentForLifePath(lifePath: CoreNumber): LifePathAlignment {
  const entry = LIFE_PATH_ALIGNMENTS[lifePath];
  if (!entry) {
    throw new RangeError(`alignmentForLifePath: no alignment for life path ${lifePath}`);
  }
  return entry;
}
