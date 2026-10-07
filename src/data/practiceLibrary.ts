/**
 * The Fortune Enhancer Practice Library: static content only.
 *
 * "Your Fortune Enhancer Practice is inspired by the numbers in your personal
 * numerology profile, especially the areas identified as needing more
 * attention. Each day, take a little time to practise, explore, notice and
 * reflect. The purpose isn't to guarantee fortune, but to help you
 * consciously look for positive possibilities and take small actions toward
 * them."
 *
 * This file contains NO completion state, user state, timestamps, profile
 * data, or AsyncStorage logic - it is pure content, exactly like
 * `interpretations.ts` or (today) `expandedRemedies.ts`. Progress through
 * this content is tracked entirely elsewhere, in the ritual/progress store.
 *
 * Content is deliberately framed as practise / explore / notice / reflect -
 * never as a guarantee of an outcome. Where a day offers a traditional
 * symbolic color cue, it is described as a personal reminder only, never as
 * having a proven or causal effect.
 */
import type { Digit } from '@/core/types';

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

export interface PracticeLibrary {
  numbers: Record<Digit, NumberPracticeSet>;
}

export interface NumberPracticeSet {
  number: Digit;
  /** The number's overall theme, e.g. "Initiative / Independence". */
  theme: string;
  keyword: string;
  /** Ordered; 7 entries today. More days can be appended later without
   *  changing this interface. */
  days: PracticeDay[];
}

export interface PracticeDay {
  /** Stable, e.g. "n1-d1" - independent of this day's position in `days`. */
  id: string;
  number: Digit;
  /** 1-based position within this number's cycle (1-7 today). */
  day: number;
  title: string;
  /** This day's short progression word/phrase, e.g. "Start", "Decide". */
  theme: string;
  morning: MorningPractice;
  afternoon: AfternoonPractice;
  night: NightPractice;
}

export interface ColorCue {
  name: string;
  /** Always framed as "traditionally associated with" - a symbolic personal
   *  reminder, never a claimed effect. */
  description: string;
  /** Practical, no-purchase-required guidance: using something the person
   *  already has nearby as a visual reminder - never a required ritual. */
  whatToDo?: string;
  /** Concrete, realistic objects the person is likely to already have
   *  nearby (clothing, a pen, a notebook, a plant...) - never something to
   *  buy or a reason to leave where they are. */
  examples?: string[];
}

export interface MorningPractice {
  /** A short "set your direction" statement for the day. */
  focus: string;
  colorCue?: ColorCue;
  activity: PracticeActivity;
}

export interface AfternoonPractice {
  introduction: string;
  /** One or more - Afternoon is where exploratory variety lives. */
  activities: PracticeActivity[];
  /** Standard prompt text, not day-specific content: "How was today's
   *  activity?" shown after the activities. Feedback only - never affects
   *  completion, cycleDay, completedCycleNumbers, or streakDays. */
  experienceFeedbackPrompt?: string;
  /** Standard prompt text, not day-specific content: "Would you like to try
   *  a similar practice again?" (Yes/No). Feedback only - the choice never
   *  completes the practice, advances cycleDay, changes
   *  completedCycleNumbers, changes streakDays, or triggers another task. */
  repeatPreferencePrompt?: string;
}

export interface NightPractice {
  reflection: string;
  /** Only present where the day's own content calls for a distinct
   *  reflective activity - not a generic filler repeated every day. */
  activity?: PracticeActivity;
  carryForwardThought: string;
  /** Standard prompt text, as AfternoonPractice above. */
  experienceFeedbackPrompt?: string;
  /** Standard prompt text, as AfternoonPractice above. */
  repeatPreferencePrompt?: string;
  /** A reflective, self-development statement for this number - never a
   *  guarantee of fortune, success, health, or relationship outcomes. The
   *  same statement recurs across a number's 21-day cycle; a future screen
   *  may offer a "read it again" style interaction (e.g. five reads), not
   *  represented here. */
  affirmation?: string;
  /** A short closing line shown after the affirmation, distinct from the
   *  day-specific carryForwardThought above. */
  closingThought?: string;
}

// ---------------------------------------------------------------------------
// Activity model
// ---------------------------------------------------------------------------

export type ActivityType =
  | 'choice'
  | 'multiChoice'
  | 'scenario'
  | 'sequence'
  | 'pattern'
  | 'memory'
  | 'logic'
  | 'sort'
  | 'observation'
  | 'creative'
  | 'realWorldAction'
  | 'reflection'
  | 'rating';

export interface ActivityOption {
  id: string;
  label: string;
  /** Optional - shown only if this option is picked. */
  feedback?: string;
}

interface ActivityBase {
  /** Stable, e.g. "n1-d1-morning" or "n1-d1-afternoon-1". */
  id: string;
  prompt: string;
  instructions?: string;
  hint?: string;
  /** A short closing line shown after the activity is done - this is the
   *  activity's own content-specific feedback, not the shared "standard
   *  activity feedback" UI chrome the future screen will provide. */
  completionFeedback?: string;
  /** Explains the connection between this activity and the day's/number's
   *  theme - answers "why am I doing this?" so a first-time user never has
   *  to guess. */
  whyThisMatters?: string;
  /** Concrete examples clarifying exactly what counts as doing the
   *  activity - never giving away a puzzle's answer where one exists. */
  examples?: string[];
  /** A short closing line connecting the activity back to today's theme,
   *  shown after the interactive control - distinct from
   *  `completionFeedback` above (which is shown only once the activity is
   *  actually done). */
  todaysReminder?: string;
  /** For an Afternoon activity that is one of several alternatives keyed to
   *  the day's Morning `choice` activity: the `ActivityOption.id` (from that
   *  Morning activity's `options`) the user must have selected for this
   *  specific Afternoon activity to apply. Omitted entirely for ordinary,
   *  always-shown activities - never a required field. */
  requiresMorningOptionId?: string;
}

/**
 * Discriminated by `type`. Objective-shaped variants (choice, multiChoice,
 * scenario, pattern, logic, sequence, sort) carry an OPTIONAL correctness
 * field - never required, since even an options-based activity may be
 * open-ended. Reflective/open variants (observation, creative,
 * realWorldAction, reflection, rating, memory) have NO correctness field at
 * all - they are never turned into quizzes.
 */
export type PracticeActivity =
  | (ActivityBase & { type: 'choice'; options: ActivityOption[]; correctOptionId?: string })
  | (ActivityBase & { type: 'multiChoice'; options: ActivityOption[]; correctOptionIds?: string[] })
  | (ActivityBase & { type: 'scenario'; scenario: string; options: ActivityOption[]; correctOptionId?: string })
  | (ActivityBase & { type: 'pattern'; sequence: string[]; options: ActivityOption[]; correctOptionId?: string })
  | (ActivityBase & { type: 'logic'; options: ActivityOption[]; correctOptionId?: string })
  | (ActivityBase & { type: 'sequence'; items: string[]; correctOrder?: string[] })
  | (ActivityBase & { type: 'sort'; items: string[]; categories: string[]; correctAssignment?: Record<string, string> })
  | (ActivityBase & { type: 'memory'; items: string[] })
  | (ActivityBase & { type: 'observation'; whatToNotice: string })
  | (ActivityBase & { type: 'creative'; whatToMake: string })
  | (ActivityBase & { type: 'realWorldAction'; whatToDo: string })
  | (ActivityBase & { type: 'reflection'; reflectionPrompt: string })
  | (ActivityBase & { type: 'rating'; scaleLabel: string; min: number; max: number });

// ---------------------------------------------------------------------------
// Authoring helpers (pure string/array construction - the exported library
// below is still a fully static value; nothing here depends on profile,
// state, or time).
// ---------------------------------------------------------------------------

const dayId = (n: number, d: number): string => `n${n}-d${d}`;
const morningId = (n: number, d: number): string => `${dayId(n, d)}-morning`;
const afternoonId = (n: number, d: number, i = 1): string => `${dayId(n, d)}-afternoon-${i}`;
const nightId = (n: number, d: number): string => `${dayId(n, d)}-night`;

function options(activityId: string, labels: readonly string[]): ActivityOption[] {
  return labels.map((label, i) => ({ id: `${activityId}-${i + 1}`, label }));
}

/**
 * The recurring, optional Body & Breath Reset - a simple physical reset with
 * no medical or health claims. Used directly inside this file's Day 8
 * content (marking the start of a new week), and exported so the Remedies
 * screen can reuse this exact same content as a recurring daily supporting
 * practice without duplicating its wording.
 */
export function bodyBreathReset(activityId: string): PracticeActivity {
  return {
    id: activityId,
    type: 'realWorldAction',
    prompt: "Before you begin today's practice:",
    whatToDo:
      'Put your mobile phone aside for a moment.\nGently stretch your arms, shoulders, body and legs.\nRelax your hands and shoulders.\nTake 3 slow, comfortable breaths.\nWhen you\'re ready, continue with today\'s practice.',
  };
}

// ---------------------------------------------------------------------------
// Standard feedback, repeat-preference and affirmation wording.
//
// The experience-feedback and repeat-preference prompts are standard, shared
// UI chrome (identical wording every day) - not day-specific content. The
// repeat-preference choice is feedback only: it never completes a practice,
// advances cycleDay, changes completedCycleNumbers, changes streakDays, or
// triggers another task.
//
// Each number's affirmation is a single reflective, self-development
// statement reused across that number's whole 21-day cycle - never a
// guarantee of fortune, success, wealth, health, or relationship outcomes.
// ---------------------------------------------------------------------------

const EXPERIENCE_FEEDBACK_PROMPT = "How was today's activity?";
const REPEAT_PREFERENCE_PROMPT = 'Would you like to try a similar practice again?';

const NUMBER_AFFIRMATIONS: Record<Digit, string> = {
  1: 'I am willing to take the first step, even when conditions are not perfect.',
  2: 'I listen with patience and see value in more than one point of view.',
  3: 'I allow myself to express ideas freely, without needing them to be perfect.',
  4: 'I bring order to what I can control, one small step at a time.',
  5: 'I stay curious and open to new ways of seeing familiar things.',
  6: 'I notice what I value, and I offer care freely to others and myself.',
  7: 'I observe closely and stay curious about what I might be missing.',
  8: 'I use what I already have wisely, and plan my next step with care.',
  9: 'I consider more than one perspective, and I look for small ways to contribute.',
};

const NUMBER_CLOSING_THOUGHTS: Record<Digit, string> = {
  1: "That's today's practice. However it went, you showed up and began.",
  2: "That's today's practice. However it went, you took a moment to connect.",
  3: "That's today's practice. However it went, you made a little room to create.",
  4: "That's today's practice. However it went, you brought a little more order to your day.",
  5: "That's today's practice. However it went, you stayed open to something new.",
  6: "That's today's practice. However it went, you took a moment to notice and care.",
  7: "That's today's practice. However it went, you paid closer attention.",
  8: "That's today's practice. However it went, you planned your next step with care.",
  9: "That's today's practice. However it went, you widened your view, even briefly.",
};

// ---------------------------------------------------------------------------
// Color cues - one per number, traditionally-associated wording only.
// ---------------------------------------------------------------------------

const RED_CUE: ColorCue = {
  name: 'Red',
  description:
    'Red is traditionally associated with Number 1 themes such as energy, initiative and new beginnings - a symbolic personal reminder, not a claimed effect.',
  whatToDo:
    "If you have something red nearby, keep it with you or place it somewhere you can see it during today's practice. There's no need to leave where you are or change what you're wearing - just use whatever is already around you. Treat the colour simply as a visual reminder for today's practice, not as something that changes how your day goes.",
  examples: [
    'A red shirt or something red you already have on',
    'A red pen',
    'A red notebook or its cover',
    'A red flower or plant nearby',
    'Any other small red item within reach',
  ],
};
const ORANGE_CUE: ColorCue = {
  name: 'Orange',
  description:
    'Traditionally associated with Number 2 themes such as connection, warmth and cooperation - a symbolic personal reminder, not a claimed effect.',
};
const YELLOW_CUE: ColorCue = {
  name: 'Yellow',
  description:
    'Traditionally associated with Number 3 themes such as expression, creativity and optimism - a symbolic personal reminder, not a claimed effect.',
};
const GREEN_CUE: ColorCue = {
  name: 'Green',
  description:
    'Traditionally associated with Number 4 themes such as structure, stability and groundedness - a symbolic personal reminder, not a claimed effect.',
};
const BLUE_CUE: ColorCue = {
  name: 'Blue',
  description:
    'Traditionally associated with Number 5 themes such as exploration, movement and adaptability - a symbolic personal reminder, not a claimed effect.',
};
const PINK_CUE: ColorCue = {
  name: 'Pink or Rose',
  description:
    'Traditionally associated with Number 6 themes such as care, warmth and appreciation - a symbolic personal reminder, not a claimed effect.',
};
const INDIGO_CUE: ColorCue = {
  name: 'Purple or Violet',
  description:
    'Traditionally associated with Number 7 themes such as reflection, curiosity and insight - a symbolic personal reminder, not a claimed effect.',
};
const DEEP_BLUE_CUE: ColorCue = {
  name: 'Dark Blue',
  description:
    'Traditionally associated with Number 8 themes such as focus, structure and capability - a symbolic personal reminder, not a claimed effect.',
};
const GOLD_CUE: ColorCue = {
  name: 'Gold or Warm Yellow',
  description:
    'Traditionally associated with Number 9 themes such as perspective, completion and generosity - a symbolic personal reminder, not a claimed effect.',
};

// ---------------------------------------------------------------------------
// Number 1 - Initiative / Independence
// ---------------------------------------------------------------------------

const NUMBER_1_DAYS: PracticeDay[] = [
  {
    id: dayId(1, 1),
    number: 1,
    day: 1,
    title: 'The First Move',
    theme: 'Start',
    morning: {
      focus: "Set your direction by naming one small task you've been putting off, then take its first step.",
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 1),
        type: 'realWorldAction',
        prompt: 'Choose one small postponed task, then take its first step.',
        instructions:
          "Think of one small task you've been putting off. It could be replying to a message, organizing something, making a phone call, starting a work task, or doing a small household task. Choose one. Now take the first concrete step toward it. You do not have to finish the whole task.",
        whatToDo: 'Take the first concrete step toward it, however small, before you do anything else today.',
        whyThisMatters:
          "Number 1 is traditionally associated with initiative - the willingness to begin something before everything feels ready. Today is a small, low-pressure way to notice what that first move actually feels like.",
        examples: [
          "If you've been putting off organizing some documents, your first step could simply be gathering them into one place.",
          "If you've been meaning to reply to a message, your first step could be opening it and reading it again before you write back.",
        ],
        todaysReminder: "You don't have to finish everything. Start with one small step.",
      },
    },
    afternoon: {
      introduction: 'Notice how it felt to begin, now that the first step is behind you.',
      activities: [
        {
          id: afternoonId(1, 1),
          type: 'observation',
          prompt: 'Look back at the moment just before you started.',
          whyThisMatters:
            'Beginning can feel like the hardest part of any task. Looking back at that exact moment - instead of rushing past it - helps you notice what initiative actually felt like today, not just what you did.',
          instructions:
            'Bring to mind the task you began this morning. Picture the moment right before you started - were you hesitant, reluctant, or simply putting it off? Then compare that to how the task felt once you were a few minutes into it.',
          whatToNotice: 'What changed in how the task felt once you had actually begun it?',
          examples: [
            "If you dreaded starting but it turned out to be quick or simple, that's worth noticing.",
            "If it still felt effortful once you began, that's useful too - starting doesn't always make something instantly easy.",
          ],
          todaysReminder: 'Starting is its own small achievement, however the task turns out.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You took a small step this morning on something you had been putting off. Think about what you started, and how it felt once you began.',
      activity: {
        id: nightId(1, 1),
        type: 'choice',
        prompt: 'How did it feel once you had started?',
        options: options(nightId(1, 1), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        'Carry forward whichever thought fits best: start sooner next time, take one more small step on this task tomorrow, try a different approach, give yourself more time, or simply leave it here for today.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 2),
    number: 1,
    day: 2,
    title: 'The One-Minute Decision',
    theme: 'Decide',
    morning: {
      focus: "Today is about deciding quickly on something small you've been putting off.",
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 2),
        type: 'realWorldAction',
        prompt: 'Pick one small decision, then make it within one minute.',
        instructions:
          "Think of one small decision you've been delaying - it doesn't need to be important, just unresolved. It could be what to wear, what to eat, which small task to tackle first, or which message to answer first. Set a one-minute mental timer. Make the decision within that minute, and don't reconsider it once it's made.",
        whatToDo: 'Make that decision within one minute, without reconsidering it afterward.',
        whyThisMatters:
          'Number 1 is traditionally associated with decisive action. Practising a fast, low-stakes decision is a simple way to notice how it feels to decide quickly, without the pressure of a decision that truly matters.',
        examples: [
          "If you've been going back and forth on what to have for breakfast, just pick one and go with it.",
          'If two small tasks are both waiting for you, decide which one to do first and start there.',
        ],
        todaysReminder: 'A small decision made quickly still counts as a decision.',
      },
    },
    afternoon: {
      introduction: 'Explore how quick decisions feel compared to slow ones.',
      activities: [
        {
          id: afternoonId(1, 2),
          type: 'scenario',
          prompt: 'Imagine you are choosing between two simple options for your next meal.',
          whyThisMatters:
            'Exploring a decision you are not actually committed to is a safe way to notice your own natural decision-making style, without any real consequence.',
          scenario: 'Both options sound equally fine. You have ten seconds to choose.',
          instructions: 'Read the scenario, then choose the response that feels most true to how you actually tend to decide.',
          options: options(afternoonId(1, 2), ['I would go with my first instinct', 'I would need a bit longer', 'I would ask someone else to choose']),
          examples: ['There is no right answer here - this is simply about noticing your own pattern.'],
          todaysReminder: 'Noticing how you decide is as useful as practising deciding quickly.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You made a quick decision this morning instead of letting it linger. Think about what that decision was, and how it felt to commit to it so quickly.',
      activity: {
        id: nightId(1, 2),
        type: 'choice',
        prompt: 'How did making that quick decision feel?',
        options: options(nightId(1, 2), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        'Carry forward whichever thought fits best: decide a little faster next time, trust your first instinct more often, try a different approach, give yourself a touch more time on bigger decisions, or simply leave this one as it is.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 3),
    number: 1,
    day: 3,
    title: 'Create It Your Way',
    theme: 'Create',
    morning: {
      focus: 'Today is about shaping something simple in your own way, without a template to follow.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 3),
        type: 'choice',
        prompt: 'Pick one simple shape to start with.',
        instructions:
          "Choose one shape from the options below. You'll use it later today as the starting point for something entirely your own - there's no need to decide what you'll make yet, just pick a shape that appeals to you right now.",
        whyThisMatters:
          "Number 1 is traditionally associated with doing things your own way, rather than following someone else's method. Starting from a single simple shape, with no instructions beyond that, is a small practice in creating independently.",
        options: options(morningId(1, 3), ['Circle', 'Square', 'Triangle', 'Line', 'Dot']),
        examples: ['There is no wrong choice here - pick whichever shape you notice yourself drawn to first.'],
        todaysReminder: 'Your way of doing this is the right way - there is no template to match.',
      },
    },
    afternoon: {
      introduction: 'Use your chosen shape as a starting point for something entirely your own.',
      activities: [
        {
          id: afternoonId(1, 3),
          type: 'creative',
          prompt: 'Make a simple pattern or picture.',
          whyThisMatters:
            'Building something from one small shape, with no instructions on what it should become, is a direct practice of independent initiative - deciding the next step yourself, again and again.',
          instructions:
            'Starting from the shape you chose this morning, add to it using circles, squares, triangles, lines and dots in whatever combination you like. You can draw it, arrange small objects, or simply picture it in your head - there is no right way to do this.',
          whatToMake:
            'Using circles, squares, triangles, lines and dots, create your own simple pattern or picture - there is no right way to do this.',
          examples: [
            'A circle could become the centre of a simple flower made from triangles.',
            'A line could become the start of a small maze made from squares.',
          ],
          todaysReminder: 'However simple it is, you made it your own way.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You made something today without a template to follow. Think about what you made, and how it felt to decide its shape yourself.',
      activity: {
        id: nightId(1, 3),
        type: 'choice',
        prompt: 'How did creating it your own way feel?',
        options: options(nightId(1, 3), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        "Carry forward whichever thought fits best: keep one shape or idea from today to use again, try creating without a template more often, try a different approach next time, give yourself more time to play with an idea, or simply leave today's creation as it is.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 4),
    number: 1,
    day: 4,
    title: 'Change One Thing',
    theme: 'Experiment',
    morning: {
      focus: "Pick one ordinary activity you'll do today, ready to change one small part of it.",
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 4),
        type: 'choice',
        prompt: 'Which ordinary activity will you experiment with today?',
        instructions:
          "Choose one small, ordinary thing you already do most days. This afternoon, you'll do it exactly as planned - except for one small, deliberate change.",
        whyThisMatters:
          'Number 1 is traditionally associated with taking the initiative to do things your own way, even inside routines that normally run on autopilot. Changing one small detail is a gentle way to practise that.',
        options: options(morningId(1, 4), ['How I make a drink', 'My usual route somewhere', 'How I greet someone', 'Something else ordinary']),
        examples: [
          'If you chose "How I make a drink", your change later could be making it in a different order, or using a different cup.',
          'If you chose "My usual route somewhere", your change later could be taking one different turn.',
        ],
        todaysReminder: 'Even a tiny change is still a change you chose to make.',
      },
    },
    afternoon: {
      introduction: 'Carry out that activity with one small, deliberate change.',
      activities: [
        {
          id: afternoonId(1, 4),
          type: 'realWorldAction',
          prompt: 'Do the activity you chose this morning.',
          whyThisMatters:
            'Noticing the effect of one small, self-chosen change is a direct, hands-on way to practise initiative inside everyday routines.',
          instructions:
            "When the moment comes to do the activity you chose this morning, make one small, deliberate change to how you normally do it. Keep the change small enough that it's still genuinely the same activity.",
          whatToDo: 'Do it slightly differently than you normally would - even a small change counts.',
          examples: ['Swapping the order of two small steps.', 'Using a different hand, route, word, or object than usual.'],
          todaysReminder: 'The size of the change matters less than the fact that you chose it.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You changed one small part of an ordinary activity. Think about what you changed, and whether you noticed anything different because of it.',
      activity: {
        id: nightId(1, 4),
        type: 'choice',
        prompt: 'How did that small change feel?',
        options: options(nightId(1, 4), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        'Carry forward whichever thought fits best: keep this change going tomorrow, try changing a different small thing next, try a different kind of change altogether, give the change more time to settle in, or simply go back to your usual way for now.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 5),
    number: 1,
    day: 5,
    title: 'The Number 1 Challenge',
    theme: 'Solve',
    morning: {
      focus: 'Warm up your independent thinking with a short logic puzzle before the day gets busy.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 5),
        type: 'logic',
        prompt: 'Work out the answer on your own, before checking the options.',
        instructions: 'Read the puzzle below carefully. Work out your own answer first, then pick the option that matches it.',
        whyThisMatters:
          'Number 1 is traditionally associated with independent thinking - reasoning something through yourself rather than checking with someone else first. A short puzzle is a safe, low-pressure way to practise that.',
        hint: 'Since the tasks are done one at a time with no breaks, their times simply add together.',
        options: options(morningId(1, 5), ['20 minutes', '30 minutes', '40 minutes', '50 minutes']),
        correctOptionId: `${morningId(1, 5)}-2`,
        examples: ['If three 10-minute tasks are done one after another with no breaks, the total time is simply 10 + 10 + 10.'],
        todaysReminder: 'You worked that out yourself - trust that kind of reasoning more often.',
      },
    },
    afternoon: {
      introduction: 'Try a short sequencing challenge on your own, without checking with anyone else first.',
      activities: [
        {
          id: afternoonId(1, 5),
          type: 'sequence',
          prompt: 'Put these steps of a simple morning routine into a logical order.',
          whyThisMatters:
            'Working out the right order for yourself, rather than asking, keeps you practising the same independent reasoning as this morning - just in a different, hands-on form.',
          instructions: 'Tap each step in the order you believe it should happen, from first to last.',
          items: ['Wake up', 'Get dressed', 'Eat breakfast', 'Leave the house'],
          correctOrder: ['Wake up', 'Get dressed', 'Eat breakfast', 'Leave the house'],
          examples: ['Think about which step physically has to happen before the next one can.'],
          todaysReminder: 'Small puzzles like this build the same muscle as bigger, real decisions.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You reasoned through two small challenges on your own today, without checking with anyone else. Think about how that felt.',
      activity: {
        id: nightId(1, 5),
        type: 'choice',
        prompt: 'How did working things out on your own feel today?',
        options: options(nightId(1, 5), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        "Carry forward whichever thought fits best: trust your own reasoning a little sooner next time, take on one more small puzzle tomorrow, try explaining your reasoning to yourself out loud, give yourself more time before deciding you're stuck, or simply leave it here for today.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 6),
    number: 1,
    day: 6,
    title: 'Start Something for Someone',
    theme: 'Act',
    morning: {
      focus: "Decide who you'd like to do something small and positive for today.",
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 6),
        type: 'choice',
        prompt: 'Who would you like to initiate something small and positive for?',
        instructions:
          "Choose one person this applies to today. You don't need to know yet what you'll do for them - you'll decide that this afternoon.",
        whyThisMatters:
          "Number 1's initiative doesn't have to be only about yourself - today practises starting something positive on someone else's behalf.",
        options: options(morningId(1, 6), ['A friend', 'A family member', 'A colleague', 'A stranger']),
        examples: ['If no one specific comes to mind for "A stranger", it can simply mean the next person you happen to interact with today.'],
        todaysReminder: 'Initiating something for someone else still counts as taking initiative.',
      },
    },
    afternoon: {
      introduction: 'Decide what that small positive action will be, then begin it.',
      activities: [
        {
          id: afternoonId(1, 6),
          type: 'realWorldAction',
          prompt: 'Initiate one small positive action for the person you chose.',
          whyThisMatters:
            "Starting something for someone else, rather than waiting to be asked, is initiative pointed outward rather than inward - a different angle on the same Number 1 theme.",
          instructions:
            'Decide on one small, genuinely doable action for the person you chose this morning, then begin it. It only needs to be started today, not necessarily finished.',
          whatToDo: 'It can be as simple as a message, a small favor, or an offer of help - the point is that you start it.',
          examples: ['Sending a short message to check in.', 'Offering a small, specific piece of help rather than a vague offer.'],
          todaysReminder: 'You started it - that is the part that was yours to do.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'Look back at your day. You started something for someone else today instead of yourself. Think about how that felt, compared to starting something of your own.',
      activity: {
        id: nightId(1, 6),
        type: 'choice',
        prompt: 'How did starting something for someone else feel?',
        options: options(nightId(1, 6), [
          'It felt easier than I expected',
          'It gave me some momentum',
          'It made me think',
          'It felt about the same as usual',
          'It was still difficult',
        ]),
      },
      carryForwardThought:
        'Carry forward whichever thought fits best: do this again for someone else soon, follow up on what you started today, try a different kind of small gesture next time, give the person a little more time to respond, or simply leave it here for today.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 7),
    number: 1,
    day: 7,
    title: 'My Next Beginning',
    theme: 'Begin Again',
    morning: {
      focus: 'Look back over this week of practising initiative, then choose what comes next.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 7),
        type: 'choice',
        prompt: 'What would you like to do with something in your life right now?',
        instructions:
          "Think back over this week - starting a postponed task, deciding quickly, creating without a template, changing something small, solving a puzzle on your own, and starting something for someone else. Then choose the direction that feels most relevant to you right now.",
        whyThisMatters:
          "This closing day of the week brings Number 1's theme full circle: initiative isn't a single event, it's something you can keep choosing to begin again.",
        options: options(morningId(1, 7), ['Begin something new', 'Improve something existing', 'Explore a new possibility']),
        examples: [
          "If this week's postponed task is still unfinished, 'Improve something existing' might be the natural choice.",
          "If this week gave you an idea you hadn't considered before, 'Explore a new possibility' might fit better.",
        ],
        todaysReminder: 'Every beginning this week has led to this one - the next beginning is still yours to choose.',
      },
    },
    afternoon: {
      introduction: 'Define the smallest possible first step for your choice.',
      activities: [
        {
          id: afternoonId(1, 7),
          type: 'reflection',
          prompt: 'Think about the smallest first step you could take.',
          whyThisMatters:
            "Ending the week by defining one small first step - rather than a whole plan - keeps the practice consistent with everything Number 1 has explored this week.",
          instructions:
            'Take a moment to picture what you chose this morning. Instead of planning the whole thing, identify just the smallest possible first step toward it.',
          reflectionPrompt: 'What is the smallest first step you could take toward what you chose this morning?',
          examples: ["If you chose 'begin something new', the smallest first step might simply be writing down the idea so it isn't forgotten."],
          todaysReminder: 'A smallest-possible first step is still a real first step.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection:
        'This week has practised starting, deciding, creating, experimenting, solving and acting. Look back over all six days before this one, and notice which parts of initiative came naturally to you, and which took more effort.',
      activity: {
        id: nightId(1, 7),
        type: 'rating',
        prompt: 'How ready do you feel to take that next first step?',
        instructions: 'Rate how ready you feel right now, honestly - there is no target number to reach.',
        scaleLabel: 'Not ready yet to very ready',
        min: 1,
        max: 5,
      },
      carryForwardThought:
        "Carry forward whichever thought fits best as you move into the next week: start sooner next time, take another small step on this week's theme, try a different approach to beginning, give yourself more time before the next first step, or simply let this week rest as it is.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 8),
    number: 1,
    day: 8,
    title: 'First Step Remix',
    theme: 'Retry',
    morning: {
      focus: 'Think of a task you have postponed or restarted before, and reconsider how you begin it.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 8),
        type: 'choice',
        prompt: "Think of a task you've postponed or restarted before. Which kind of first step would make it easiest to begin again?",
        options: options(morningId(1, 8), ['Make it smaller', 'Make it clearer', 'Make it faster']),
      },
    },
    afternoon: {
      introduction: 'Use the kind of step you chose this morning on one real task.',
      activities: [
        {
          id: afternoonId(1, 8),
          type: 'realWorldAction',
          prompt: 'Apply your chosen approach.',
          whatToDo: "Take that smaller, clearer, or faster first step on a real task today, and notice when you've done enough to call it started.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "A first step doesn't have to look the same every time - sometimes it just needs to change shape.",
      carryForwardThought: 'Remember which version of a first step worked best today; you can reuse it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 9),
    number: 1,
    day: 9,
    title: 'Choose Your Way',
    theme: 'Decide',
    morning: {
      focus: 'Compare two safe ways of doing one small thing today, and pick one.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 9),
        type: 'scenario',
        prompt: 'Choose how you will approach one small task today.',
        scenario: 'You have two ways to handle a small task today: a quick, familiar way, or a slightly different way you have not tried.',
        options: options(morningId(1, 9), ['Take the familiar way', 'Try the different way']),
      },
    },
    afternoon: {
      introduction: 'Carry out the approach you chose this morning.',
      activities: [
        {
          id: afternoonId(1, 9),
          type: 'realWorldAction',
          prompt: 'Follow through on your choice.',
          whatToDo: 'Complete that one small task using the approach you picked, start to finish.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Comparing two safe options is its own kind of initiative - you still have to choose and act.',
      carryForwardThought: 'Notice tomorrow whether your choice changed how the task actually turned out.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 10),
    number: 1,
    day: 10,
    title: 'Make It Yours',
    theme: 'Personalize',
    morning: {
      focus: 'Pick one routine you repeat often and design a small change that would make it feel more like your own.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 10),
        type: 'creative',
        prompt: 'Design a small change to a familiar routine.',
        whatToMake: 'Choose a routine you repeat often - making tea, your commute, tidying up - and plan one small change to how you do it.',
      },
    },
    afternoon: {
      introduction: 'Try your adapted routine today, as you planned it this morning.',
      activities: [
        {
          id: afternoonId(1, 10),
          type: 'realWorldAction',
          prompt: 'Run your adapted routine.',
          whatToDo: 'Carry out the routine using the small change you designed, and notice what feels different.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'A routine done your own way can feel less like a chore and more like a choice.',
      activity: {
        id: nightId(1, 10),
        type: 'rating',
        prompt: "How different did today's version of the routine feel compared to usual?",
        scaleLabel: 'Not very different to very different',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep the version that felt most like yours - you can repeat it tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 11),
    number: 1,
    day: 11,
    title: 'Initiative in Action',
    theme: 'Act Now',
    morning: {
      focus: 'Watch for a moment today when waiting is just a habit, not a necessity.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 11),
        type: 'observation',
        prompt: 'Watch for an unnecessary pause today.',
        whatToNotice: 'Notice a moment when you are waiting for permission, a better time, or someone else to go first - and whether that waiting is actually needed.',
      },
    },
    afternoon: {
      introduction: 'When you spot that moment, act on it instead of waiting it out.',
      activities: [
        {
          id: afternoonId(1, 11),
          type: 'realWorldAction',
          prompt: 'Act instead of waiting.',
          whatToDo: 'Take one appropriate step in that moment instead of continuing to wait, even if it is small.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Not all waiting is necessary - some of it is just habit wearing the disguise of patience.',
      carryForwardThought: 'Tomorrow, watch for another moment like this one.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 12),
    number: 1,
    day: 12,
    title: 'Create a Starting Point',
    theme: 'Prototype',
    morning: {
      focus: 'Think of an idea you have been turning over in your head but have not started.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 12),
        type: 'reflection',
        prompt: 'Name an idea you have not started yet.',
        reflectionPrompt: 'What is the smallest, roughest version of this idea you could make today - not the finished thing, just a starting point?',
      },
    },
    afternoon: {
      introduction: 'Build that tiny first version now, while it is still fresh.',
      activities: [
        {
          id: afternoonId(1, 12),
          type: 'creative',
          prompt: 'Make your tiny first version.',
          whatToMake: 'Create the smallest rough version of your idea you can finish in a short sitting - a sketch, a list, a draft, a note, or a sample.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'A rough first version is not the real thing yet, but it makes the real thing easier to start.',
      activity: {
        id: nightId(1, 12),
        type: 'rating',
        prompt: 'How close did your tiny version feel to something you could build on?',
        scaleLabel: 'Not close at all to very close',
        min: 1,
        max: 5,
      },
      carryForwardThought: "Keep this starting point somewhere you'll see it again this week.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 13),
    number: 1,
    day: 13,
    title: 'The One-Action Challenge',
    theme: 'Focus',
    morning: {
      focus: 'Decide whether finishing or starting matters more for you right now.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 13),
        type: 'choice',
        prompt: 'Look at your task list or the things on your mind today. Which matters more right now?',
        options: options(morningId(1, 13), ['Finishing one thing already started', 'Starting something brand new']),
      },
    },
    afternoon: {
      introduction: 'Put your choice into practice with one simple rule.',
      activities: [
        {
          id: afternoonId(1, 13),
          type: 'realWorldAction',
          prompt: 'Complete one action before starting another.',
          whatToDo: 'Pick one unfinished action and complete it fully before you let yourself begin anything new today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Starting new things comes easily with initiative - finishing one thing first is a different kind of discipline.',
      carryForwardThought: 'Notice tomorrow how it feels to begin something fresh with fewer loose ends behind you.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 14),
    number: 1,
    day: 14,
    title: 'Foundation Review',
    theme: 'Review',
    morning: {
      focus: 'Think back over this week of practice before looking anything up.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 14),
        type: 'memory',
        prompt: 'Recall this week without looking back.',
        instructions: 'Think of what each of these asked you to do, in any order you remember them.',
        items: [
          'First Step Remix',
          'Choose Your Way',
          'Make It Yours',
          'Initiative in Action',
          'Create a Starting Point',
          'The One-Action Challenge',
        ],
      },
    },
    afternoon: {
      introduction: 'Pick out which kind of beginning worked best for you this week.',
      activities: [
        {
          id: afternoonId(1, 14),
          type: 'multiChoice',
          prompt: 'Which of these kinds of beginnings helped you most this week?',
          options: options(afternoonId(1, 14), [
            'Making the first step smaller',
            'Choosing between two clear options',
            'Adapting something familiar',
            'Acting instead of waiting',
            'Making a rough first version',
            'Finishing before starting something new',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Every beginning this week looked a little different, but each one still needed a first move.',
      activity: {
        id: nightId(1, 14),
        type: 'rating',
        prompt: 'How confident do you feel starting things compared to a week ago?',
        scaleLabel: 'No more confident to much more confident',
        min: 1,
        max: 5,
      },
      carryForwardThought: "Keep whichever kind of beginning you picked in mind - you'll use it again.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 15),
    number: 1,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Combine',
    morning: {
      focus: "Pick one small decision you've been putting off and plan to pair it with action.",
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 15),
        type: 'choice',
        prompt: "Think of one small decision you've been putting off. How will you handle it today?",
        options: options(morningId(1, 15), ['Decide now, act on it later today', 'Decide and act immediately']),
      },
    },
    afternoon: {
      introduction: 'Follow through based on what you chose this morning.',
      activities: [
        {
          id: afternoonId(1, 15),
          type: 'realWorldAction',
          prompt: 'Decide, then act.',
          whatToDo: "Make the decision you've been avoiding, then take the first action that follows from it, today.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Deciding and acting are two separate moves that work best when they are paired together.',
      carryForwardThought: 'Notice which part - deciding or acting - was harder for you today.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 16),
    number: 1,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: 'Think back across this 21-day practice so far, before today.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 16),
        type: 'reflection',
        prompt: 'Pick one practice from this cycle to revisit.',
        reflectionPrompt: 'Which single practice from Days 1 to 15 felt most useful or natural to you?',
      },
    },
    afternoon: {
      introduction: 'Change one detail of that practice to fit today better, then try it.',
      activities: [
        {
          id: afternoonId(1, 16),
          type: 'realWorldAction',
          prompt: 'Adapt and try it.',
          whatToDo: 'Take the practice you picked, change one detail about it - the timing, the size, or the setting - and try the adapted version today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "The practices in this cycle are templates, not rules - they're meant to be adjusted.",
      carryForwardThought: 'Keep track of whether the adaptation felt better than the original.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 17),
    number: 1,
    day: 17,
    title: 'My Own Challenge',
    theme: 'Self-Challenge',
    morning: {
      focus: 'Choose the kind of starting challenge you want to set for yourself today.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 17),
        type: 'choice',
        prompt: 'Choose the kind of starting challenge you want to set for yourself today.',
        options: options(morningId(1, 17), ['A skill challenge', 'A task challenge', 'A habit challenge']),
      },
    },
    afternoon: {
      introduction: 'Turn your choice into a real one-day challenge, then complete it.',
      activities: [
        {
          id: afternoonId(1, 17, 1),
          type: 'creative',
          prompt: 'Write your challenge.',
          whatToMake: "One sentence describing what you'll begin today and how you'll know it has started, based on the kind you chose this morning.",
        },
        {
          id: afternoonId(1, 17, 2),
          type: 'realWorldAction',
          prompt: 'Complete your challenge.',
          whatToDo: 'Carry out the challenge you just wrote for yourself.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'A challenge you set for yourself can feel different from one someone else hands you.',
      activity: {
        id: nightId(1, 17),
        type: 'rating',
        prompt: 'How motivating was it to follow a challenge you created yourself?',
        scaleLabel: 'Not motivating to very motivating',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Notice if self-made challenges push you more than ones given to you.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 18),
    number: 1,
    day: 18,
    title: 'A New Way Forward',
    theme: 'New Angle',
    morning: {
      focus: 'Think of a task you always start the same way, and consider a different point to start from.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 18),
        type: 'reflection',
        prompt: 'Find a new starting point for a familiar task.',
        reflectionPrompt: 'What is one different point you could start from this time - a different step, order, or tool - for a task you always begin the same way?',
      },
    },
    afternoon: {
      introduction: 'Begin the task from that new starting point.',
      activities: [
        {
          id: afternoonId(1, 18),
          type: 'realWorldAction',
          prompt: 'Start from somewhere new.',
          whatToDo: 'Start the familiar task from the different point you identified, instead of your usual first step.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Changing where you start can change how the whole task feels, even when the task itself stays the same.',
      carryForwardThought: 'Notice if this new starting point becomes your new default.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 19),
    number: 1,
    day: 19,
    title: 'Bring It Together',
    theme: 'Follow Through',
    morning: {
      focus: 'Pick one small goal you can realistically act on today.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 19),
        type: 'choice',
        prompt: 'Pick one small goal you can realistically act on today.',
        options: options(morningId(1, 19), ['A goal for today only', 'A goal for this week']),
      },
    },
    afternoon: {
      introduction: 'Plan the order, then act on your goal.',
      activities: [
        {
          id: afternoonId(1, 19, 1),
          type: 'sequence',
          prompt: 'Put these in the order that makes sense for tackling a small goal.',
          instructions: 'There is a logical order for this, even though any of these could technically come first.',
          items: ['Take the first action', 'Check progress before continuing', 'Decide exactly what done looks like'],
          correctOrder: ['Decide exactly what done looks like', 'Take the first action', 'Check progress before continuing'],
        },
        {
          id: afternoonId(1, 19, 2),
          type: 'realWorldAction',
          prompt: 'Act on your goal.',
          whatToDo: 'Take the first action toward the goal you picked this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Choosing, acting, and reviewing in the same day is initiative in miniature.',
      activity: {
        id: nightId(1, 19),
        type: 'rating',
        prompt: 'How far did you get on your goal today?',
        scaleLabel: 'Barely started to fully done',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Decide tomorrow whether this goal needs another step.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 20),
    number: 1,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Keep What Works',
    morning: {
      focus: 'Sort the practices from this cycle by how useful they have actually been for you.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 20),
        type: 'sort',
        prompt: 'Sort these practices from the past 19 days into how useful they have been for you.',
        instructions: 'Place each one into the category that fits best for you - there is no right answer.',
        items: [
          'Taking a first step immediately',
          'Making tasks smaller',
          'Choosing between two options',
          'Adapting things to suit you',
          'Making rough first versions',
          'Finishing before starting something new',
        ],
        categories: ['Keep using', 'Maybe later', 'Not needed'],
      },
    },
    afternoon: {
      introduction: "Focus on whichever practice you sorted into 'Keep using'.",
      activities: [
        {
          id: afternoonId(1, 20),
          type: 'realWorldAction',
          prompt: 'Use your top practice on purpose.',
          whatToDo: "Use the practice you sorted into 'Keep using' on something today, on purpose.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Not every practice needs to stick - the point is knowing which ones work for you.',
      carryForwardThought: 'Keep this sorted list somewhere you can check it again later.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
  {
    id: dayId(1, 21),
    number: 1,
    day: 21,
    title: 'My Next Beginning',
    theme: 'Cycle Review',
    morning: {
      focus: 'Look back over the full 21 days of this practice before choosing what comes next.',
      colorCue: RED_CUE,
      activity: {
        id: morningId(1, 21),
        type: 'reflection',
        prompt: 'Look back over all 21 days.',
        reflectionPrompt: 'Across this whole cycle, what changed in how you approach starting things?',
      },
    },
    afternoon: {
      introduction: 'Choose one or two practices from the full cycle to keep using going forward.',
      activities: [
        {
          id: afternoonId(1, 21),
          type: 'multiChoice',
          prompt: 'Which one or two practices from this cycle are you most likely to keep using?',
          instructions: 'Pick one or two - not the whole list.',
          options: options(afternoonId(1, 21), [
            'Starting a postponed task with a smaller first step',
            'Taking the lead instead of waiting',
            'Making a tiny first version of an idea',
            'Finishing one action before starting another',
            'Adapting a routine or practice to fit me',
            'Setting my own starting challenge',
            'Choosing between two options and acting',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Twenty-one days of starting things is less about any single day and more about what carries forward from here.',
      activity: {
        id: nightId(1, 21),
        type: 'rating',
        prompt: 'How useful did this whole 21-day practice feel?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep practicing whichever beginning you chose today until it feels natural.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[1],
      closingThought: NUMBER_CLOSING_THOUGHTS[1],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 2 - Connection / Perspective
// ---------------------------------------------------------------------------

const NUMBER_2_DAYS: PracticeDay[] = [
  {
    id: dayId(2, 1),
    number: 2,
    day: 1,
    title: 'The Quiet Listener',
    theme: 'Listen',
    morning: {
      focus: 'Set an intention to really listen in your next conversation today.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 1),
        type: 'reflection',
        prompt: 'Before your next conversation, remind yourself of one thing.',
        reflectionPrompt: 'Can you listen without preparing your response while the other person is still speaking?',
      },
    },
    afternoon: {
      introduction: 'During a conversation today, notice more than just the words being said.',
      activities: [
        {
          id: afternoonId(2, 1),
          type: 'observation',
          prompt: 'Pay attention beyond the words.',
          whatToNotice: "Notice the other person's tone and expressions, not only what they say.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you picked up on today that you might otherwise have missed.',
      carryForwardThought: 'Consider trying this kind of listening again in tomorrow\'s first conversation.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 2),
    number: 2,
    day: 2,
    title: 'Two Ways to See It',
    theme: 'Reframe',
    morning: {
      focus: 'Pick a simple situation from your day to look at more closely.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 2),
        type: 'choice',
        prompt: 'Which kind of situation would you like to look at today?',
        options: options(morningId(2, 2), ['Something at home', 'Something at work or school', 'Something with a friend', 'Something you saw or read']),
      },
    },
    afternoon: {
      introduction: 'Look at the situation you chose from two different angles.',
      activities: [
        {
          id: afternoonId(2, 2),
          type: 'scenario',
          prompt: 'Think about the situation you picked this morning.',
          scenario: 'Consider it first from your own point of view, then from another possible point of view.',
          options: options(afternoonId(2, 2), ['My first view still feels right', 'The second view changes things a little', 'The second view changes things a lot']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether looking at it a second way changed how you feel about it.',
      carryForwardThought: 'Keep this second-view habit in mind for a situation tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 3),
    number: 2,
    day: 3,
    title: 'The Silent Signal',
    theme: 'Observe',
    morning: {
      focus: 'Pause wherever you are this morning and simply look around.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 3),
        type: 'observation',
        prompt: 'Pause and look around you.',
        whatToNotice: 'Notice three details in your surroundings that you would not usually pay attention to.',
      },
    },
    afternoon: {
      introduction: 'Carry that noticing habit into one more moment later in the day.',
      activities: [
        {
          id: afternoonId(2, 3),
          type: 'observation',
          prompt: 'Find a different place or moment.',
          whatToNotice: 'Notice three more small details somewhere different from this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how much more there usually is to see than we normally take in.',
      carryForwardThought: 'Consider which everyday moment tomorrow deserves a second, closer look.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 4),
    number: 2,
    day: 4,
    title: 'Connect & Collaborate',
    theme: 'Cooperate',
    morning: {
      focus: 'Choose how you would like to connect today - social participation here is entirely optional.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 4),
        type: 'choice',
        prompt: 'Which path would you like to take today?',
        options: options(morningId(2, 4), ['With someone', 'On my own', 'AstroMatrix challenge']),
      },
    },
    afternoon: {
      introduction: 'Follow through on the path you chose this morning.',
      activities: [
        {
          id: afternoonId(2, 4, 1),
          type: 'realWorldAction',
          prompt: 'With someone.',
          whatToDo: 'Invite another person to do a simple joint activity with you today, such as a short walk or a quick chat.',
          requiresMorningOptionId: `${morningId(2, 4)}-1`,
        },
        {
          id: afternoonId(2, 4, 2),
          type: 'realWorldAction',
          prompt: 'On my own.',
          whatToDo: 'Spend a few quiet minutes planning something you would normally do together with others.',
          requiresMorningOptionId: `${morningId(2, 4)}-2`,
        },
        {
          id: afternoonId(2, 4, 3),
          type: 'creative',
          prompt: 'AstroMatrix challenge.',
          whatToMake: 'Imagine or sketch a simple way two different, unrelated things could work together.',
          requiresMorningOptionId: `${morningId(2, 4)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how the path you chose felt, compared to how you expected it to feel.',
      carryForwardThought: 'Consider whether you would choose the same path again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 5),
    number: 2,
    day: 5,
    title: 'The Patience Experiment',
    theme: 'Pause',
    morning: {
      focus: 'Pick a normal waiting moment you expect to have today.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 5),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'What is one ordinary waiting moment you expect today - a queue, a red light, a loading screen?',
      },
    },
    afternoon: {
      introduction: 'When that waiting moment comes, try something different with it.',
      activities: [
        {
          id: afternoonId(2, 5),
          type: 'observation',
          prompt: 'During that waiting moment, pause instead of filling the time.',
          whatToNotice: 'Notice what is around you instead of reaching for your phone or rushing the moment along.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how the pause felt compared to how you usually fill waiting moments.',
      carryForwardThought: 'Keep this pause in mind for the next waiting moment you notice.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 6),
    number: 2,
    day: 6,
    title: 'Two Become One',
    theme: 'Combine',
    morning: {
      focus: 'Pick two unrelated everyday things to bring together later today.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 6),
        type: 'choice',
        prompt: 'What kind of pair would you like to combine today?',
        options: options(morningId(2, 6), ['Two objects', 'An object and an idea', 'Two activities']),
      },
    },
    afternoon: {
      introduction: 'Bring your two unrelated things together into something new.',
      activities: [
        {
          id: afternoonId(2, 6),
          type: 'creative',
          prompt: 'Combine two unrelated things.',
          whatToMake: 'Combine the two things you picked this morning into one new idea, object, or activity.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you created by putting two unrelated things together.',
      carryForwardThought: 'Consider whether this combination is worth trying again, or sharing with someone.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 7),
    number: 2,
    day: 7,
    title: 'The Connection Map',
    theme: 'Appreciate',
    morning: {
      focus: 'Picture yourself at the centre of a map of everything around you.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 7),
        type: 'reflection',
        prompt: 'Picture a map with "Me" at the centre.',
        reflectionPrompt: 'Who and what would surround you on that map today?',
      },
    },
    afternoon: {
      introduction: 'Add detail to your connection map.',
      activities: [
        {
          id: afternoonId(2, 7),
          type: 'creative',
          prompt: 'Build your connection map.',
          whatToMake: 'Sketch or list five people, places, activities or things connected to "Me" at the centre.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Look back at the connections you mapped this week - listening, reframing, observing, cooperating, pausing and combining.',
      carryForwardThought: 'Choose one connection from your map to appreciate before the day ends.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 8),
    number: 2,
    day: 8,
    title: 'Listen for the Detail',
    theme: 'Detail',
    morning: {
      focus: 'Set an intention to notice one small detail in how people communicate with you today.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 8),
        type: 'observation',
        prompt: 'Notice beyond just the words in one conversation today.',
        whatToNotice:
          'Catch one specific detail - a word someone repeats, a change in their tone, or a flicker of expression - that you might usually miss.',
      },
    },
    afternoon: {
      introduction: 'Later today, test how much of that detail actually stayed with you.',
      activities: [
        {
          id: afternoonId(2, 8),
          type: 'memory',
          prompt: 'After a conversation ends, see how much you can recall.',
          instructions: 'Wait until the conversation is over, then try to remember these without looking back.',
          items: [
            'A word or phrase they used more than once',
            'How their tone changed, if it did',
            'One expression or gesture you noticed',
            'Something they left unsaid',
          ],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Think about how much of today you noticed versus how much passed by unnoticed.',
      carryForwardThought: 'Tomorrow, pick a different conversation to pay this kind of attention to.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 9),
    number: 2,
    day: 9,
    title: 'The Perspective Pair',
    theme: 'Perspective',
    morning: {
      focus: 'Bring to mind a topic where two reasonable people could see things differently.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 9),
        type: 'scenario',
        scenario:
          'Two people at work disagree about whether meetings should be shorter. One says short meetings save everyone time; the other says short meetings skip over important detail.',
        prompt: 'Which side do you find yourself leaning toward first?',
        options: options(morningId(2, 9), [
          'The short-meetings view',
          'The detailed-meetings view',
          'I can see solid reasons on both sides',
        ]),
      },
    },
    afternoon: {
      introduction: 'Pick a real, low-stakes topic you and someone else see differently.',
      activities: [
        {
          id: afternoonId(2, 9),
          type: 'creative',
          prompt: 'Write out both reasonable sides.',
          whatToMake:
            "Write down two different, reasonable ways someone could see this situation - even if you don't agree with both of them.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether writing out the other side changed how strongly you felt about your own view.',
      carryForwardThought: 'Keep this pair of viewpoints in mind next time this topic comes up.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 10),
    number: 2,
    day: 10,
    title: 'Pause Before Replying',
    theme: 'Pause',
    morning: {
      focus: "Decide that in at least one conversation today, you'll pause before you reply.",
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 10),
        type: 'rating',
        prompt: "Rate how often you usually reply right away, before you've fully taken in what the other person said.",
        scaleLabel: 'Rarely to Almost always',
        min: 1,
        max: 5,
      },
    },
    afternoon: {
      introduction: 'Turn that intention into one real moment today.',
      activities: [
        {
          id: afternoonId(2, 10),
          type: 'realWorldAction',
          prompt: 'Practise the pause for real.',
          whatToDo:
            'In your next conversation, silently count to three after the other person finishes speaking, before you say anything back.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what that short pause did to what you ended up saying.',
      carryForwardThought: 'Try the same pause again tomorrow, in a conversation that matters a little more.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 11),
    number: 2,
    day: 11,
    title: 'Connect the Ideas',
    theme: 'Combine',
    morning: {
      focus: 'Look for two separate ideas today that could fit together.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 11),
        type: 'pattern',
        prompt: 'Find the pairing that continues the pattern.',
        instructions: 'Each pair links a fruit with its colour. Work out which colour completes the last pair.',
        sequence: ['Apple - Red', 'Banana - Yellow', 'Grape - Purple', 'Lemon - ?'],
        options: options(morningId(2, 11), ['Yellow', 'Red', 'Purple', 'Green']),
        correctOptionId: `${morningId(2, 11)}-1`,
      },
    },
    afternoon: {
      introduction: 'Now try combining two ideas of your own, not just a pattern.',
      activities: [
        {
          id: afternoonId(2, 11),
          type: 'creative',
          prompt: 'Combine two unrelated ideas from your own day.',
          whatToMake:
            'Pick two separate things on your mind right now - a task, a person, a plan - and write one sentence on how they could connect or support each other.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether that combination felt forced or genuinely useful.',
      carryForwardThought: 'Keep an eye out tomorrow for another unexpected pairing.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 12),
    number: 2,
    day: 12,
    title: 'The Patience Choice',
    theme: 'Patience',
    morning: {
      focus: "Expect at least one small delay today, and decide now how you'd like to respond to it.",
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 12),
        type: 'scenario',
        scenario: "You're waiting in a slow-moving queue and you can feel yourself getting impatient.",
        prompt: 'Which response would feel calmer in that moment?',
        options: options(morningId(2, 12), [
          'Take a slow breath and look at something unrelated',
          'Keep checking how much the line has moved',
          'Run through everything else you still need to do today',
        ]),
      },
    },
    afternoon: {
      introduction: 'Sort some everyday reactions to delay or waiting.',
      activities: [
        {
          id: afternoonId(2, 12),
          type: 'sort',
          prompt: 'Sort these reactions into the two groups.',
          instructions: "There's no single right split - sort based on how each one feels to you.",
          items: [
            'Taking a slow breath',
            'Sighing loudly',
            'Checking the time repeatedly',
            'Looking around at something unrelated',
            'Tapping your foot or fingers',
            'Reminding yourself the delay is temporary',
          ],
          categories: ['Calmer', 'More frustrated'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Think about today's delay and how your actual reaction compared to the one you planned.",
      activity: {
        id: nightId(2, 12),
        type: 'reflection',
        prompt: 'Look back at the moment of delay today.',
        reflectionPrompt: 'What would help you respond a little calmer the next time this happens?',
      },
      carryForwardThought: 'Keep that one idea ready for the next small delay, whenever it comes.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 13),
    number: 2,
    day: 13,
    title: 'Shared or Solo',
    theme: 'Together',
    morning: {
      focus: "Decide whether today's challenge works better for you with someone else or on your own.",
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 13),
        type: 'choice',
        prompt: "Choose how you'd like to approach today's challenge.",
        options: options(morningId(2, 13), [
          'With someone',
          'On my own',
          'A separate independent challenge instead',
        ]),
      },
    },
    afternoon: {
      introduction: 'Use the activity that matches what you chose this morning.',
      activities: [
        {
          id: afternoonId(2, 13, 1),
          type: 'realWorldAction',
          prompt: 'With someone',
          instructions: 'Use this one if you chose "With someone."',
          whatToDo:
            'Make one small decision together with another person today - like what to eat or which route to take - by each sharing a preference before deciding.',
          requiresMorningOptionId: `${morningId(2, 13)}-1`,
        },
        {
          id: afternoonId(2, 13, 2),
          type: 'scenario',
          prompt: 'On my own',
          instructions: 'Use this one if you chose "On my own."',
          scenario: 'Imagine making that same kind of small decision, but you have to weigh two different preferences yourself.',
          options: options(afternoonId(2, 13, 2), [
            'Picture what each side would want, then choose a middle path',
            "Pick whichever option you'd personally prefer",
            'Flip a coin and let chance decide',
          ]),
          requiresMorningOptionId: `${morningId(2, 13)}-2`,
        },
        {
          id: afternoonId(2, 13, 3),
          type: 'memory',
          prompt: 'A separate independent challenge',
          instructions: 'Use this one if you chose the separate challenge.',
          items: [
            'A colour you saw today',
            'A sound you heard',
            'Something someone said',
            'A smell you noticed',
            'An object you touched',
          ],
          requiresMorningOptionId: `${morningId(2, 13)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Notice how it felt to choose your own way of taking on today's challenge.",
      carryForwardThought: 'Remember that either way - with someone or alone - counts as completing it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 14),
    number: 2,
    day: 14,
    title: 'Connection Review',
    theme: 'Review',
    morning: {
      focus: 'Look back over this past week of noticing, pausing and connecting.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 14),
        type: 'reflection',
        prompt: 'Think back over this week - detail, perspective, pausing, combining, patience, and shared or solo.',
        reflectionPrompt: 'Which of these felt the most natural to you, and which felt the most effortful?',
      },
    },
    afternoon: {
      introduction: "Narrow this week down to what's worth repeating.",
      activities: [
        {
          id: afternoonId(2, 14),
          type: 'multiChoice',
          prompt: "Select any of this week's practices you'd be willing to try again.",
          options: options(afternoonId(2, 14), [
            'Noticing a small detail in conversation',
            'Comparing two viewpoints',
            'Pausing before replying',
            'Combining two separate ideas',
            'Choosing a calmer response',
            'The shared-or-solo challenge',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how this week of exploring connection has felt overall.',
      activity: {
        id: nightId(2, 14),
        type: 'rating',
        prompt: 'Rate how connected you felt to the people and moments around you this week.',
        scaleLabel: 'Not very connected to Very connected',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry whichever practice you selected into next week, and expect it to feel a little different each time.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 15),
    number: 2,
    day: 15,
    title: 'Listen + Reflect',
    theme: 'Blend',
    morning: {
      focus: 'Set an intention to listen for both the words and the viewpoint behind them.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 15),
        type: 'sequence',
        prompt: "Put these steps of a thoughtful conversation in the order you'd use them.",
        instructions: "There's a reasonable order here, even if real conversations don't always go exactly this way.",
        items: [
          'Notice the feeling or viewpoint behind the words',
          'Respond',
          'Listen fully without planning your reply',
          'Consider how else the situation could look',
        ],
        correctOrder: [
          'Listen fully without planning your reply',
          'Notice the feeling or viewpoint behind the words',
          'Consider how else the situation could look',
          'Respond',
        ],
      },
    },
    afternoon: {
      introduction: 'Try holding both layers at once in a real exchange.',
      activities: [
        {
          id: afternoonId(2, 15),
          type: 'observation',
          prompt: 'In one real conversation today, notice both layers at once.',
          whatToNotice: 'Notice the words someone uses and, separately, what viewpoint or feeling seems to sit underneath them.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Think about how different it felt to track both the words and the viewpoint at the same time.',
      carryForwardThought: 'Pick one of those layers to focus on more closely tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 16),
    number: 2,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: "Pick one practice from this cycle so far that you'd like to try again, slightly adjusted.",
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 16),
        type: 'choice',
        prompt: 'Pick one practice from this cycle to adjust and try again.',
        options: options(morningId(2, 16), [
          'Noticing a detail in conversation',
          'Comparing two viewpoints',
          'Pausing before replying',
          'Combining two ideas',
          'Choosing a calmer response',
          'The connection map from day 7',
        ]),
      },
    },
    afternoon: {
      introduction: 'Change one thing about it before you use it again.',
      activities: [
        {
          id: afternoonId(2, 16),
          type: 'realWorldAction',
          prompt: 'Adjust the practice you picked and try it today.',
          whatToDo:
            'Change one thing about how you do it - make it shorter, longer, or apply it to a new situation - then use your adjusted version at least once today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Think about how it felt to change something that was already becoming familiar.',
      activity: {
        id: nightId(2, 16),
        type: 'observation',
        prompt: 'Look back on today.',
        whatToNotice: 'Notice whether your adjusted version felt easier, harder, or just different from the original.',
      },
      carryForwardThought: "Decide whether you'll keep the adjustment or go back to the original version.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 17),
    number: 2,
    day: 17,
    title: 'My Own Connection Challenge',
    theme: 'Create',
    morning: {
      focus: 'Think about what has made a practice this cycle easy or hard to stick with.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 17),
        type: 'reflection',
        prompt: "Think about the listening and perspective practices you've tried across this cycle.",
        reflectionPrompt:
          'What makes a small exercise like this actually easy to remember and use, rather than something you forget by lunchtime?',
      },
    },
    afternoon: {
      introduction: 'Use what you just noticed to design something of your own.',
      activities: [
        {
          id: afternoonId(2, 17),
          type: 'creative',
          prompt: 'Design a short practice of your own.',
          instructions: 'It should take a minute or less and focus on listening or seeing another point of view.',
          whatToMake:
            "Write two or three steps for a listening or perspective exercise you could use again - for yourself, or to share with someone else.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it felt like to design something instead of just following instructions.',
      activity: {
        id: nightId(2, 17),
        type: 'realWorldAction',
        prompt: 'If you have a moment left today, test it out.',
        whatToDo: 'Try the exercise you designed, even briefly, and see how it feels in practice.',
      },
      carryForwardThought: "Keep your exercise somewhere you'll see it again - you can refine it later.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 18),
    number: 2,
    day: 18,
    title: 'Another Point of View',
    theme: 'Widen',
    morning: {
      focus: "Choose a perspective that's less familiar to you to deliberately consider today.",
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 18),
        type: 'multiChoice',
        prompt: 'Choose one or two unfamiliar perspectives you could deliberately consider today.',
        options: options(morningId(2, 18), [
          'Someone much older or younger than you',
          'A stranger passing by',
          'Someone who disagrees with an opinion you hold',
          'Someone with a very different daily routine than yours',
        ]),
      },
    },
    afternoon: {
      introduction: 'Practise that kind of thinking on a small, real situation.',
      activities: [
        {
          id: afternoonId(2, 18),
          type: 'logic',
          prompt: 'A colleague has been unusually quiet in meetings this week.',
          instructions: "Before settling on the most obvious explanation, consider which of these you'd look into first.",
          options: options(afternoonId(2, 18), [
            'They might be overloaded with something unrelated to the meeting',
            "They might feel their ideas haven't landed well recently",
            'They might simply prefer listening this week',
            'They might be unwell or tired',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether holding an unfamiliar perspective today changed how you judged anything.',
      carryForwardThought: 'Try the same unfamiliar perspective again tomorrow, with a different situation.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 19),
    number: 2,
    day: 19,
    title: 'Bring It Together',
    theme: 'Align',
    morning: {
      focus: 'Plan to bring listening, pausing and thoughtful replying together in one conversation.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 19),
        type: 'reflection',
        prompt: 'Think about listening, pausing and responding thoughtfully as three separate skills.',
        reflectionPrompt: 'Which of the three is hardest for you to hold onto once a conversation gets busy or emotional?',
      },
    },
    afternoon: {
      introduction: 'Bring all three together in one real exchange today.',
      activities: [
        {
          id: afternoonId(2, 19),
          type: 'realWorldAction',
          prompt: 'Bring the three together in one real conversation today.',
          whatToDo: 'Listen fully, pause briefly before replying, and then give a considered response - all in the same exchange.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which of the three came easiest, and which you had to work at.',
      carryForwardThought: 'Pick the hardest one of the three to focus on again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 20),
    number: 2,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Keep',
    morning: {
      focus: 'Think over the practices from this cycle and which ones genuinely fit your life.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 20),
        type: 'choice',
        prompt: "Of everything you've practised this cycle, choose the one that matters most to you going forward.",
        options: options(morningId(2, 20), [
          'Noticing detail in conversation',
          'Seeing more than one viewpoint',
          'Pausing before replying',
          'Combining separate ideas',
          'Responding calmly to delays',
          'Working well with or without others',
        ]),
      },
    },
    afternoon: {
      introduction: "Sort this cycle's practices into what to keep and what to set aside.",
      activities: [
        {
          id: afternoonId(2, 20),
          type: 'sort',
          prompt: "Sort this cycle's practices into two groups.",
          instructions: "There's no wrong answer here - sort based on what actually fits your life right now.",
          items: [
            'Noticing detail in conversation',
            'Seeing more than one viewpoint',
            'Pausing before replying',
            'Combining separate ideas',
            'Responding calmly to delays',
            'Working well with or without others',
          ],
          categories: ['Keep doing', 'Set aside for now'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to narrow six practices down to just a few.',
      activity: {
        id: nightId(2, 20),
        type: 'realWorldAction',
        prompt: 'Act on your choice today.',
        whatToDo: "Do one small thing connected to the practice you chose to keep, even if it's brief.",
      },
      carryForwardThought: "Tomorrow you'll look back across the whole cycle - for now, just notice what you kept.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
  {
    id: dayId(2, 21),
    number: 2,
    day: 21,
    title: 'My Connection Path',
    theme: 'Continue',
    morning: {
      focus: 'Look back across all 21 days before deciding what comes next.',
      colorCue: ORANGE_CUE,
      activity: {
        id: morningId(2, 21),
        type: 'reflection',
        prompt: 'Look back across all 21 days of this connection practice.',
        reflectionPrompt: 'What changed in how you listen, consider other viewpoints, or handle small moments of friction with others?',
      },
    },
    afternoon: {
      introduction: "Choose what from this whole cycle is worth carrying forward.",
      activities: [
        {
          id: afternoonId(2, 21),
          type: 'multiChoice',
          prompt: 'Choose one or two practices from this whole cycle to carry forward.',
          instructions: 'Pick the ones that felt most useful, not necessarily the easiest.',
          options: options(afternoonId(2, 21), [
            'Really listening without planning your reply',
            'Noticing detail in tone or expression',
            'Comparing two reasonable viewpoints',
            'Pausing before you respond',
            'Combining two separate ideas',
            'Responding calmly to small delays',
            'Choosing to work with others or solo, depending on the task',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Think over the full 21 days, start to finish.',
      activity: {
        id: nightId(2, 21),
        type: 'rating',
        prompt: 'Rate how useful this 21-day practice felt overall.',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep using whatever you chose to carry forward - you can always come back and repeat this cycle later.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[2],
      closingThought: NUMBER_CLOSING_THOUGHTS[2],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 3 - Creativity / Expression
// ---------------------------------------------------------------------------

const NUMBER_3_DAYS: PracticeDay[] = [
  {
    id: dayId(3, 1),
    number: 3,
    day: 1,
    title: 'The Three Ideas',
    theme: 'Ideas',
    morning: {
      focus: 'Choose which of three creative directions calls to you this morning.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 1),
        type: 'choice',
        prompt: 'Which direction would you like to take today?',
        options: options(morningId(3, 1), ['Express', 'Imagine', 'Create']),
      },
    },
    afternoon: {
      introduction: 'Follow your chosen direction in whatever way feels natural.',
      activities: [
        {
          id: afternoonId(3, 1),
          type: 'creative',
          prompt: 'Follow your chosen path.',
          whatToMake: 'Express a feeling, imagine a possibility, or create something small - whichever you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what came out when you gave yourself room to express, imagine or create.',
      carryForwardThought: 'Keep one idea from today in mind for later in the week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 2),
    number: 3,
    day: 2,
    title: 'Say It Another Way',
    theme: 'Expression',
    morning: {
      focus: 'Choose a lens for today\'s expression.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 2),
        type: 'choice',
        prompt: 'Which lens would you like to explore today?',
        options: options(morningId(3, 2), ['Expression', 'Communication', 'Perspective']),
      },
    },
    afternoon: {
      introduction: 'Take one ordinary thought and say it in a new way.',
      activities: [
        {
          id: afternoonId(3, 2),
          type: 'creative',
          prompt: 'Say something differently.',
          whatToMake: 'Take one ordinary thought from today and express it differently than usual - a new word, a small drawing, or a different tone.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether saying it differently changed how the thought felt to you.',
      carryForwardThought: 'Consider using this new way of saying things again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 3),
    number: 3,
    day: 3,
    title: 'Look Again',
    theme: 'Observation',
    morning: {
      focus: 'Choose how you want to approach something ordinary today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 3),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(3, 3), ['Observe', 'Imagine', 'Discover']),
      },
    },
    afternoon: {
      introduction: 'Look again at something ordinary with fresh attention.',
      activities: [
        {
          id: afternoonId(3, 3),
          type: 'observation',
          prompt: 'Look again at something familiar.',
          whatToNotice: 'Notice one new detail in something you see often but rarely really look at.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what a second, closer look revealed that a first glance missed.',
      carryForwardThought: 'Pick one more familiar thing to look at again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 4),
    number: 3,
    day: 4,
    title: 'Three-Step Pattern',
    theme: 'Patterns',
    morning: {
      focus: 'Choose how you want to engage with patterns today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 4),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(3, 4), ['Create', 'Recognize', 'Think']),
      },
    },
    afternoon: {
      introduction: 'Try a short pattern-recognition challenge.',
      activities: [
        {
          id: afternoonId(3, 4),
          type: 'pattern',
          prompt: 'What comes next in this pattern?',
          sequence: ['circle', 'square', 'circle', 'square'],
          options: options(afternoonId(3, 4), ['circle', 'square', 'triangle']),
          correctOptionId: `${afternoonId(3, 4)}-1`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to spot and complete a simple pattern.',
      carryForwardThought: 'Notice one more pattern in your surroundings before the day ends.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 5),
    number: 3,
    day: 5,
    title: 'The Three-Choice Challenge',
    theme: 'Choices',
    morning: {
      focus: 'Choose how you want to approach today\'s creative moment.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 5),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(3, 5), ['Think', 'Choose', 'Explore']),
      },
    },
    afternoon: {
      introduction: 'Imagine three different ways to spend ten free minutes creatively.',
      activities: [
        {
          id: afternoonId(3, 5),
          type: 'choice',
          prompt: 'Which of these calls to you right now?',
          options: options(afternoonId(3, 5), ['Drawing or doodling', 'Writing a few lines', 'Making something with your hands']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which choice you were drawn to, and why.',
      carryForwardThought: 'Consider trying one of the other two options another day.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 6),
    number: 3,
    day: 6,
    title: 'Mix & Create',
    theme: 'Combining',
    morning: {
      focus: 'Pick two unrelated things to combine later today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 6),
        type: 'choice',
        prompt: 'What kind of pair would you like to combine today?',
        options: options(morningId(3, 6), ['Two objects', 'Two ideas', 'An object and an idea']),
      },
    },
    afternoon: {
      introduction: 'Combine your two things into something new, using simple shapes or icons if that helps.',
      activities: [
        {
          id: afternoonId(3, 6),
          type: 'creative',
          prompt: 'Mix and create.',
          whatToMake: 'Combine your two unrelated things into something new - a simple drawing using basic shapes or icons can help if you like.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you imagined by combining two unrelated things.',
      carryForwardThought: 'Keep this new combination in mind - it might be useful again later.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 7),
    number: 3,
    day: 7,
    title: 'My Creative Spark',
    theme: 'Creative Carry-Forward',
    morning: {
      focus: 'Look back over this week\'s creative moments - ideas, expression, observation, patterns, choices and combining.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which moment from this week felt most like a creative spark?',
      },
    },
    afternoon: {
      introduction: 'Choose one creative moment from this week to carry forward.',
      activities: [
        {
          id: afternoonId(3, 7),
          type: 'choice',
          prompt: 'Which moment would you like to notice and keep?',
          options: options(afternoonId(3, 7), ['Ideas', 'Expression', 'Observation', 'Patterns', 'Choices', 'Combining']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has explored ideas, expression, observation, patterns, choices and combining.',
      carryForwardThought: 'Carry your chosen creative spark into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 8),
    number: 3,
    day: 8,
    title: 'Three New Uses',
    theme: 'Reimagine',
    morning: {
      focus: 'Pick an everyday object to look at differently today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 8),
        type: 'choice',
        prompt: 'Which object would you like to work with today?',
        options: options(morningId(3, 8), ['A spoon', 'A rubber band', 'A paperclip', 'A sock']),
      },
    },
    afternoon: {
      introduction: 'Come up with three unexpected uses for the object you chose - the more unusual, the better.',
      activities: [
        {
          id: afternoonId(3, 8),
          type: 'creative',
          prompt: 'List three new uses.',
          whatToMake: 'Three unexpected uses for your chosen object - try to make at least one of them surprising.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which of your three uses felt the most surprising, even to you.',
      carryForwardThought: 'Ordinary objects usually have more than one purpose - you just have to look for it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 9),
    number: 3,
    day: 9,
    title: 'Change the Story',
    theme: 'Endings',
    morning: {
      focus: 'Choose a simple scenario to write two different endings for.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 9),
        type: 'scenario',
        scenario: 'Someone finds an unmarked box on their doorstep with no note attached.',
        prompt: 'Which kind of ending would you like to try first?',
        options: options(morningId(3, 9), ['A funny ending', 'A mysterious ending', 'A heartwarming ending']),
      },
    },
    afternoon: {
      introduction: 'Write two different endings to the doorstep scenario - start with the kind you chose, then try a completely different one.',
      activities: [
        {
          id: afternoonId(3, 9),
          type: 'creative',
          prompt: 'Write two endings.',
          whatToMake: 'Two different endings for the doorstep scenario - the one you chose this morning, then a second one that takes it somewhere completely different.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how differently the story felt depending on which ending you gave it.',
      carryForwardThought: 'The same starting point can lead almost anywhere - the ending is your choice.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 10),
    number: 3,
    day: 10,
    title: 'Pattern Remix',
    theme: 'Remix',
    morning: {
      focus: 'Spot the pattern before you remix it.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 10),
        type: 'pattern',
        sequence: ['Circle', 'Square', 'Circle', 'Square', 'Circle'],
        prompt: 'What comes next in this pattern?',
        options: options(morningId(3, 10), ['Triangle', 'Square', 'Circle']),
        correctOptionId: `${morningId(3, 10)}-2`,
      },
    },
    afternoon: {
      introduction: 'Take the pattern from this morning and change just one element to make a new version.',
      activities: [
        {
          id: afternoonId(3, 10),
          type: 'creative',
          prompt: 'Remix the pattern.',
          whatToMake: 'A new version of the pattern from this morning with exactly one element changed - a shape, a color, or the rule itself.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how much a single small change altered the feel of the whole pattern.',
      activity: {
        id: nightId(3, 10),
        type: 'rating',
        prompt: 'How enjoyable did spotting and remixing the pattern feel?',
        scaleLabel: 'Not enjoyable to very enjoyable',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'One small change is often enough to make something feel new.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 11),
    number: 3,
    day: 11,
    title: 'Creative Constraint',
    theme: 'Constraint',
    morning: {
      focus: 'Choose three elements to limit yourself to before you create anything.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 11),
        type: 'multiChoice',
        prompt: 'Pick exactly three elements to work with today.',
        instructions: 'Choose three - no more, no less. These are the only elements you will allow yourself to use this afternoon.',
        options: options(morningId(3, 11), ['A color', 'A shape', 'A number', 'A word', 'A sound', 'A texture']),
      },
    },
    afternoon: {
      introduction: 'Create something small using only the three elements you chose - nothing else allowed.',
      activities: [
        {
          id: afternoonId(3, 11),
          type: 'creative',
          prompt: 'Create within your constraint.',
          whatToMake: 'Something small - a drawing, a short phrase, a tiny plan - built using only your three chosen elements.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the limit made things harder, easier, or just different.',
      carryForwardThought: 'A limit is not the opposite of creativity - sometimes it is the push that starts it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 12),
    number: 3,
    day: 12,
    title: 'Imagine the Opposite',
    theme: 'Opposites',
    morning: {
      focus: 'Pick something familiar to flip into its opposite later today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 12),
        type: 'choice',
        prompt: 'What would you like to imagine the opposite of?',
        options: options(morningId(3, 12), ['A daily habit', 'A room in your home', 'A rule you usually follow']),
      },
    },
    afternoon: {
      introduction: 'Imagine the complete opposite of what you chose - let it be as different as possible.',
      activities: [
        {
          id: afternoonId(3, 12),
          type: 'creative',
          prompt: 'Imagine the opposite.',
          whatToMake: 'A description or sketch of the complete opposite version of what you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what imagining the opposite showed you about the original.',
      carryForwardThought: 'Looking at the reverse of something often reveals what you take for granted about it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 13),
    number: 3,
    day: 13,
    title: 'Combine & Explain',
    theme: 'Purpose',
    morning: {
      focus: 'Choose a pairing to combine - then think about what it could actually be for.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 13),
        type: 'logic',
        prompt: 'Which pairing seems most likely to produce something actually useful, not just interesting?',
        options: options(morningId(3, 13), ['Two animals', 'Two jobs', 'Two emotions', 'An object and a feeling']),
      },
    },
    afternoon: {
      introduction: 'Combine two specific items from your chosen pairing into one new thing, then explain what it is actually for.',
      activities: [
        {
          id: afternoonId(3, 13, 1),
          type: 'creative',
          prompt: 'Combine your pair.',
          whatToMake: 'Two specific items from your chosen pairing (for example, two particular animals, or two particular jobs) combined into one new thing.',
        },
        {
          id: afternoonId(3, 13, 2),
          type: 'reflection',
          prompt: 'Explain its purpose.',
          reflectionPrompt: 'In a sentence or two, what is your new combination actually useful for?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the purpose came easily or took some digging to find.',
      carryForwardThought: 'A new combination becomes useful once you can say what it is for.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 14),
    number: 3,
    day: 14,
    title: 'Creative Review',
    theme: 'Review',
    morning: {
      focus: 'Look back over this week and choose what sparked the most curiosity.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 14),
        type: 'choice',
        prompt: 'Which activity from this week unlocked the most curiosity for you?',
        options: options(morningId(3, 14), ['Three New Uses', 'Change the Story', 'Pattern Remix', 'Creative Constraint', 'Imagine the Opposite', 'Combine & Explain']),
      },
    },
    afternoon: {
      introduction: 'Give the activity you chose one more quick go, even in a smaller way than before.',
      activities: [
        {
          id: afternoonId(3, 14),
          type: 'creative',
          prompt: 'Revisit it briefly.',
          whatToMake: 'A smaller, faster version of the activity you chose - just enough to feel that spark again.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it is about that activity that keeps your curiosity going.',
      activity: {
        id: nightId(3, 14),
        type: 'rating',
        prompt: 'How curious did this week of exploring make you feel overall?',
        scaleLabel: 'Not curious to very curious',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'The activity that pulls your curiosity back is worth returning to on purpose.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 15),
    number: 3,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Together',
    morning: {
      focus: 'Choose two methods from this cycle to use together today.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 15),
        type: 'multiChoice',
        prompt: 'Which two methods would you like to combine today?',
        instructions: 'Pick exactly two - you will use them together this afternoon.',
        options: options(morningId(3, 15), ['Generating new uses', 'Flipping to the opposite', 'Remixing a pattern', 'Working inside a constraint', 'Combining two things']),
      },
    },
    afternoon: {
      introduction: 'Apply both of your chosen methods to the same object or idea, one after the other.',
      activities: [
        {
          id: afternoonId(3, 15),
          type: 'creative',
          prompt: 'Apply both methods.',
          whatToMake: 'One result that uses both of your chosen methods on the same object or idea, applied one after the other.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether using two methods together felt additive or like something new altogether.',
      carryForwardThought: 'Methods combine just as easily as objects or ideas do.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 16),
    number: 3,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: 'Recall the activities from this cycle before picking a favorite to adapt.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 16),
        type: 'memory',
        prompt: 'Without scrolling back, try to recall as many of the activities from this 21-day cycle as you can.',
        instructions: 'Think it through for a moment first, then check the list below to see how many you remembered.',
        items: ['The Three Ideas', 'Mix & Create', 'Three New Uses', 'Change the Story', 'Pattern Remix', 'Creative Constraint', 'Imagine the Opposite', 'Combine & Explain', 'Combine & Apply'],
      },
    },
    afternoon: {
      introduction: 'Pick your favorite from the list, then adapt it in one specific way.',
      activities: [
        {
          id: afternoonId(3, 16, 1),
          type: 'choice',
          prompt: 'Which activity would you like to adapt?',
          options: options(afternoonId(3, 16, 1), ['Three New Uses', 'Pattern Remix', 'Creative Constraint', 'Imagine the Opposite', 'Combine & Explain']),
        },
        {
          id: afternoonId(3, 16, 2),
          type: 'creative',
          prompt: 'Adapt it.',
          whatToMake: 'A version of your chosen activity changed in one specific way - a new object, a new rule, or a new pairing.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what the adaptation added that the original version did not have.',
      carryForwardThought: 'A favorite activity can keep giving you something new if you change one thing about it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 17),
    number: 3,
    day: 17,
    title: 'My Creative Challenge',
    theme: 'Challenge',
    morning: {
      focus: 'Design a five-minute creative challenge you could do on the spot.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 17),
        type: 'creative',
        prompt: 'Design your challenge.',
        whatToMake: 'A five-minute creative challenge for yourself - name the task, the time limit, and one simple rule.',
      },
    },
    afternoon: {
      introduction: 'Carry out the five-minute challenge you just designed.',
      activities: [
        {
          id: afternoonId(3, 17),
          type: 'realWorldAction',
          prompt: 'Do your challenge.',
          whatToDo: 'Set a five-minute timer and complete the challenge you designed this morning, exactly as you wrote it.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how the time limit changed the way you approached the task.',
      activity: {
        id: nightId(3, 17),
        type: 'rating',
        prompt: 'How well did your five-minute challenge work for you?',
        scaleLabel: 'Not well to very well',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'A short, clear challenge can be just as useful as a long open-ended one.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 18),
    number: 3,
    day: 18,
    title: 'New Angle',
    theme: 'Perspective',
    morning: {
      focus: 'Pick something familiar to look at from a completely different angle.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 18),
        type: 'observation',
        prompt: 'Observe it closely first.',
        whatToNotice: 'Choose something familiar nearby - an object, a room, a daily route - and notice three details about it you have never really paid attention to before.',
      },
    },
    afternoon: {
      introduction: 'Now reinterpret what you observed from a new angle, as if you were encountering it for the first time.',
      activities: [
        {
          id: afternoonId(3, 18),
          type: 'creative',
          prompt: 'Reinterpret it.',
          whatToMake: 'A short description of your chosen thing as seen from a completely different angle - as if you were encountering it for the first time, or as a completely different person would see it.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what the new angle let you see that your usual view does not.',
      carryForwardThought: 'A different angle does not change the thing itself, only what you notice about it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 19),
    number: 3,
    day: 19,
    title: 'Bring It Together',
    theme: 'Flow',
    morning: {
      focus: 'Choose a starting point, then order the steps of your creative process in the way that feels right to you.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 19),
        type: 'sequence',
        prompt: 'Arrange these steps in the order that feels most natural to you today.',
        items: ['Imagine freely, without limits', 'Choose one direction', 'Make it real', 'Reflect on it'],
      },
    },
    afternoon: {
      introduction: 'Follow your own order: imagine a few directions, then create something from the one you choose.',
      activities: [
        {
          id: afternoonId(3, 19, 1),
          type: 'creative',
          prompt: 'Imagine a few directions.',
          whatToMake: 'Two or three quick directions you could take from a simple starting idea, object, or feeling.',
        },
        {
          id: afternoonId(3, 19, 2),
          type: 'creative',
          prompt: 'Create from one direction.',
          whatToMake: 'Something small made from the one direction you liked best out of the ones you just imagined.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how imagining first, then creating, then reflecting, felt as one continuous flow.',
      activity: {
        id: nightId(3, 19),
        type: 'reflection',
        prompt: 'Bring it together.',
        reflectionPrompt: 'Looking back at today, which part - imagining, creating, or reflecting - felt most like "you"?',
      },
      carryForwardThought: 'Imagining, creating and reflecting are three parts of the same habit, not three separate tasks.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 20),
    number: 3,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choosing',
    morning: {
      focus: "Sort this cycle's creative skills into what you want to keep practicing and what you are ready to let go of.",
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 20),
        type: 'sort',
        prompt: 'Sort these into the two categories.',
        instructions: 'There is no wrong split - sort based on what you actually want to keep doing.',
        items: ['Generating new ideas', 'Combining unrelated things', 'Remixing patterns', 'Working inside a constraint', 'Flipping to the opposite', 'Changing endings'],
        categories: ['Keep practicing', 'Done for now'],
      },
    },
    afternoon: {
      introduction: 'Give a quick, real go to whichever skill landed in your keep-practicing group.',
      activities: [
        {
          id: afternoonId(3, 20),
          type: 'creative',
          prompt: 'Practice it once more.',
          whatToMake: 'A quick result using the creative skill you most want to keep practicing.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to choose rather than try to keep everything.',
      activity: {
        id: nightId(3, 20),
        type: 'rating',
        prompt: 'How clear do you feel about which creative practices matter most to you?',
        scaleLabel: 'Not clear to very clear',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keeping a few practices well beats holding onto all of them loosely.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
  {
    id: dayId(3, 21),
    number: 3,
    day: 21,
    title: 'My Creative Spark',
    theme: 'Cycle Review',
    morning: {
      focus: 'Look back over the full 21 days before deciding what comes next.',
      colorCue: YELLOW_CUE,
      activity: {
        id: morningId(3, 21),
        type: 'reflection',
        prompt: 'Look back over the full cycle.',
        reflectionPrompt: 'Thinking back over all 21 days, what changed in how you approach being creative, even in a small way?',
      },
    },
    afternoon: {
      introduction: 'Choose one or two practices from this cycle you would like to carry forward.',
      activities: [
        {
          id: afternoonId(3, 21),
          type: 'multiChoice',
          prompt: 'Pick one or two practices to carry forward.',
          instructions: 'Choose up to two - the ones you are most likely to actually keep doing.',
          options: options(afternoonId(3, 21), ['Choosing a creative direction each morning', 'Combining two unrelated things', 'Generating new uses for ordinary objects', 'Remixing a pattern', 'Working inside a constraint', 'Reinterpreting something familiar', 'Designing a five-minute challenge']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This cycle is complete - however it went, you showed up and practiced.',
      activity: {
        id: nightId(3, 21),
        type: 'rating',
        prompt: 'How useful did this whole 21-day practice feel?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep the one or two practices you chose - everything else can simply rest.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[3],
      closingThought: NUMBER_CLOSING_THOUGHTS[3],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 4 - Structure / Order
// ---------------------------------------------------------------------------

const NUMBER_4_DAYS: PracticeDay[] = [
  {
    id: dayId(4, 1),
    number: 4,
    day: 1,
    title: 'Create Order',
    theme: 'Order',
    morning: {
      focus: 'Choose how you would like to bring a little more order into today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 1),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 1), ['Organize', 'Simplify', 'Begin']),
      },
    },
    afternoon: {
      introduction: 'Put your chosen approach into practice on one small space or task.',
      activities: [
        {
          id: afternoonId(4, 1),
          type: 'realWorldAction',
          prompt: 'Create a little order.',
          whatToDo: 'Organize, simplify, or begin tidying one small space or task, based on what you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to bring a small amount of order into one part of your day.',
      carryForwardThought: 'Consider which space or task deserves the same attention tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 2),
    number: 4,
    day: 2,
    title: 'Build a Pattern',
    theme: 'Structure',
    morning: {
      focus: 'Choose how you would like to approach structure today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 2),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 2), ['Structure', 'Notice', 'Solve']),
      },
    },
    afternoon: {
      introduction: 'Try a short number-pattern challenge.',
      activities: [
        {
          id: afternoonId(4, 2),
          type: 'pattern',
          prompt: 'What comes next in this sequence: 2, 4, 6, 8, ?',
          sequence: ['2', '4', '6', '8'],
          options: options(afternoonId(4, 2), ['9', '10', '12']),
          correctOptionId: `${afternoonId(4, 2)}-2`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to find the structure underneath a simple pattern.',
      carryForwardThought: 'Notice one more structure or pattern in your day tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 3),
    number: 4,
    day: 3,
    title: 'The Practical Fix',
    theme: 'Fixes',
    morning: {
      focus: 'Choose how you want to approach a small problem today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 3),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 3), ['Think', 'Solve', 'Improve']),
      },
    },
    afternoon: {
      introduction: 'Think of one small practical problem you are facing.',
      activities: [
        {
          id: afternoonId(4, 3),
          type: 'reflection',
          prompt: 'Think of one small practical problem in your day.',
          reflectionPrompt: 'What is one way you could solve or improve it, even with limited time?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to find one practical fix rather than solving everything at once.',
      carryForwardThought: 'Consider putting this small fix into action tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 4),
    number: 4,
    day: 4,
    title: 'Four Corners',
    theme: 'Sorting',
    morning: {
      focus: 'Choose how you want to approach today\'s sorting practice.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 4),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 4), ['Observe', 'Sort', 'Organize']),
      },
    },
    afternoon: {
      introduction: 'Pick four small items near you and decide where each belongs.',
      activities: [
        {
          id: afternoonId(4, 4),
          type: 'sort',
          prompt: 'Sort these four everyday items into a corner each.',
          items: ['A pen', 'A piece of paper', 'A cup', 'A charger'],
          categories: ['Keep here', 'Put away', 'Pass on or recycle', 'Unsure'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how deciding where each item belongs felt.',
      carryForwardThought: 'Consider sorting four more items tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 5),
    number: 4,
    day: 5,
    title: 'Build It Better',
    theme: 'Improvement',
    morning: {
      focus: 'Choose how you want to approach improvement today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 5),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 5), ['Improve', 'Arrange', 'Strengthen']),
      },
    },
    afternoon: {
      introduction: 'Pick one small thing and make it a little better.',
      activities: [
        {
          id: afternoonId(4, 5),
          type: 'realWorldAction',
          prompt: 'Build it a little better.',
          whatToDo: 'Choose one small thing and make it a little more arranged, improved, or sturdier than it was.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice the difference your small improvement made.',
      carryForwardThought: 'Consider whether there is a next small improvement worth making tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 6),
    number: 4,
    day: 6,
    title: 'The Four-Step Challenge',
    theme: 'Sequence',
    morning: {
      focus: 'Choose how you want to approach planning today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 6),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 6), ['Sequence', 'Plan', 'Complete']),
      },
    },
    afternoon: {
      introduction: 'Try putting a simple four-step process into order.',
      activities: [
        {
          id: afternoonId(4, 6),
          type: 'sequence',
          prompt: 'Put these four steps into a logical order.',
          items: ['Decide what to do', 'Gather what you need', 'Do it', 'Check it is finished'],
          correctOrder: ['Decide what to do', 'Gather what you need', 'Do it', 'Check it is finished'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how having a clear sequence made a small task feel more manageable.',
      carryForwardThought: 'Consider using this four-step sequence for a task tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 7),
    number: 4,
    day: 7,
    title: 'My Strong Foundation',
    theme: 'Foundation',
    morning: {
      focus: 'Look back over this week\'s practice of order, patterns, fixes, sorting, improvement and sequence.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which part of this week\'s structure practice felt most useful to you?',
      },
    },
    afternoon: {
      introduction: 'Choose which part of this week\'s practice you would like to continue.',
      activities: [
        {
          id: afternoonId(4, 7),
          type: 'choice',
          prompt: 'Which part of this week\'s structure practice would you like to continue?',
          options: options(afternoonId(4, 7), ['Order', 'Patterns', 'Fixes', 'Sorting', 'Improvement', 'Sequence']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has built a foundation of order, patterns, fixes, sorting, improvement and sequence.',
      carryForwardThought: 'Carry your chosen foundation forward into next week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 8),
    number: 4,
    day: 8,
    title: 'Order in Motion',
    theme: 'Routine',
    morning: {
      focus: "Choose how you'd like to look at one of your regular routines today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 8),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 8), ['Map it out', 'Reorder it', 'Time it']),
      },
    },
    afternoon: {
      introduction: 'Try putting a simple getting-ready routine into its most logical order.',
      activities: [
        {
          id: afternoonId(4, 8),
          type: 'sequence',
          prompt: 'Put these four steps of getting ready to leave the house into a logical order.',
          instructions: 'Think about which step naturally needs to happen before the next one.',
          items: ['Check the weather', 'Decide what you need to bring', 'Get dressed', 'Gather your things by the door'],
          correctOrder: ['Check the weather', 'Decide what you need to bring', 'Get dressed', 'Gather your things by the door'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the order you chose matches how you actually get ready most days.',
      carryForwardThought: 'Consider trying this exact order tomorrow morning to see how it feels.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 9),
    number: 4,
    day: 9,
    title: 'Pattern Detective',
    theme: 'Pattern',
    morning: {
      focus: "Choose how you'd like to look for patterns today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 9),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 9), ['Compare', 'Predict', 'Notice']),
      },
    },
    afternoon: {
      introduction: 'Look at the sequence below and work out what makes it predictable.',
      activities: [
        {
          id: afternoonId(4, 9),
          type: 'pattern',
          prompt: 'What comes next in this sequence?',
          instructions: 'Look at how each number changes from the one before it, then choose the option that continues the pattern.',
          hint: 'Look at how much each number increases by.',
          sequence: ['2', '4', '6', '8'],
          options: options(afternoonId(4, 9), ['9', '10', '12']),
          correctOptionId: `${afternoonId(4, 9)}-2`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Think about one system in your day, like a bus schedule or a weekly routine, that feels predictable because of its pattern.',
      activity: {
        id: nightId(4, 9),
        type: 'observation',
        prompt: 'Notice one predictable pattern around you this evening.',
        whatToNotice: 'A routine, schedule, or sequence you can predict because it repeats in the same way each time, such as a meal time, a commute, or a chore schedule.',
      },
      carryForwardThought: 'Consider which other parts of your day follow a predictable pattern.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 10),
    number: 4,
    day: 10,
    title: 'Practical Improvement',
    theme: 'Simplify',
    morning: {
      focus: "Choose which kind of task you'd like to simplify today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 10),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 10), ['A chore', 'A digital task', 'A habit']),
      },
    },
    afternoon: {
      introduction: "Pick one task you do regularly and look for a step that isn't really necessary.",
      activities: [
        {
          id: afternoonId(4, 10),
          type: 'realWorldAction',
          prompt: 'Remove one unnecessary step from a task you repeat.',
          whatToDo: 'Choose a task you do often, walk through its steps, and find one step you can skip or combine with another without changing the result. Do the task that way today.',
          hint: 'Look for a step that exists out of habit rather than necessity.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether removing that step made any real difference to the outcome.',
      carryForwardThought: 'Consider keeping the task this simpler way going forward.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 11),
    number: 4,
    day: 11,
    title: 'Structure Challenge',
    theme: 'Arrange',
    morning: {
      focus: "Choose the rule you'd like to arrange something by today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 11),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 11), ['By size', 'By frequency of use', 'By priority']),
      },
    },
    afternoon: {
      introduction: 'Sort a small group of everyday items using the rule you chose this morning.',
      activities: [
        {
          id: afternoonId(4, 11),
          type: 'sort',
          prompt: 'Sort these common desk items into groups based on how often you use them.',
          instructions: "There is no single right answer here - sort based on your own habits, or imagine a typical desk if these don't match yours.",
          items: ['Pens and pencils', 'Loose papers', 'Books', 'Chargers and cables', 'Sticky notes'],
          categories: ['Use daily - keep closest', 'Use weekly - keep nearby', 'Rarely used - store away'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to have a clear rule guiding where things belonged.',
      activity: {
        id: nightId(4, 11),
        type: 'rating',
        prompt: 'How organized did the arranged space feel afterward?',
        scaleLabel: 'Not very organized to very organized',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider applying the same rule to one more space this week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 12),
    number: 4,
    day: 12,
    title: 'Small System',
    theme: 'System',
    morning: {
      focus: "Choose what kind of system you'd like to build today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 12),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 12), ['A checklist', 'A schedule', 'A labeling system']),
      },
    },
    afternoon: {
      introduction: 'Design a short, repeatable system for something you do often.',
      activities: [
        {
          id: afternoonId(4, 12),
          type: 'creative',
          prompt: 'Create a simple system you could reuse.',
          whatToMake: 'A short checklist, schedule, or labeling system with three to five steps or items, for a task you repeat often, such as packing a bag, closing up for the night, or starting your workday.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether writing the system down made it feel clearer or more repeatable.',
      carryForwardThought: 'Consider using your new system the next time this task comes up.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 13),
    number: 4,
    day: 13,
    title: 'Four-Step Review',
    theme: 'Review',
    morning: {
      focus: "Choose how you'd like to review a process today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 13),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 13), ['Spot the extra step', 'Combine steps', 'Reorder steps']),
      },
    },
    afternoon: {
      introduction: 'Look at this four-step process and decide which step could be simplified.',
      activities: [
        {
          id: afternoonId(4, 13),
          type: 'scenario',
          prompt: 'Which step could be removed or combined with another, without changing the outcome?',
          scenario: 'A short process for watering a houseplant: 1) Check if the soil is dry. 2) Get the watering can. 3) Fill the watering can with water. 4) Pour water on the soil until damp.',
          hint: 'Look for two steps that could easily happen as one.',
          options: options(afternoonId(4, 13), ['Combine steps 2 and 3', 'Remove step 1', 'Remove step 4']),
          correctOptionId: `${afternoonId(4, 13)}-1`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how looking for one unnecessary step changes the way you see a routine process.',
      carryForwardThought: 'Consider applying this kind of review to one of your own four-step tasks.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 14),
    number: 4,
    day: 14,
    title: 'Foundation Review',
    theme: 'Reflect',
    morning: {
      focus: 'Choose which area of structure felt strongest for you this week.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 14),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 14), ['Routines', 'Patterns', 'Simplifying']),
      },
    },
    afternoon: {
      introduction: "Look back over this week's practices and choose which ones made the biggest difference for you.",
      activities: [
        {
          id: afternoonId(4, 14),
          type: 'multiChoice',
          prompt: 'Which structures from this week helped you most? Choose one or two.',
          instructions: 'Think back over the past week: ordering a routine, spotting a pattern, removing a step, arranging by a rule, building a small system, and reviewing a process.',
          options: options(afternoonId(4, 14), [
            'Ordering a routine',
            'Spotting a pattern',
            'Removing an unnecessary step',
            'Arranging by a rule',
            'Building a small system',
            'Reviewing a four-step process',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which kind of structure you return to naturally, without having to think about it.',
      activity: {
        id: nightId(4, 14),
        type: 'rating',
        prompt: 'How much did having structure help you get through this week?',
        scaleLabel: 'Not much to a great deal',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider leaning on whichever structure helped most as you move into the next week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 15),
    number: 4,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Combine',
    morning: {
      focus: "Choose which pair you'd like to try today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 15),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 15), ['Organize, then simplify', 'Plan, then improve', 'Sort, then remove a step']),
      },
    },
    afternoon: {
      introduction: 'Pick one task or space, organize it, and then look for one unnecessary step or item to remove.',
      activities: [
        {
          id: afternoonId(4, 15),
          type: 'realWorldAction',
          prompt: 'Organize something, then improve it.',
          whatToDo: 'Choose one small task or space. First bring some order to it, then look for one extra step or item you can remove or simplify.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether combining these two actions felt different from doing just one of them.',
      carryForwardThought: 'Consider which other tasks might benefit from this same two-step approach.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 16),
    number: 4,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: "Choose which earlier practice you'd like to revisit today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 16),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 16), ['The four-step sequence', 'The small system you built', 'The arranging rule']),
      },
    },
    afternoon: {
      introduction: 'Revisit one structure you tried earlier in this cycle, then simplify it.',
      activities: [
        {
          id: afternoonId(4, 16),
          type: 'memory',
          prompt: 'Before checking back, try to recall the details of these earlier practices.',
          instructions: 'See how much you remember about each one without looking back at prior days.',
          items: ['The four-step sequence (Day 6)', 'Ordering a morning routine (Day 8)', 'The small system you built (Day 12)'],
        },
        {
          id: afternoonId(4, 16, 2),
          type: 'logic',
          prompt: 'Which single change would make that structure simpler?',
          instructions: 'Pick the change that would reduce the structure to fewer steps while still getting the same result.',
          options: options(afternoonId(4, 16, 2), ['Combine two steps into one', 'Remove the least useful step', 'Shorten the time it takes']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the simplified version still does the job the original did.',
      carryForwardThought: 'Consider using this simplified version going forward instead of the original.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 17),
    number: 4,
    day: 17,
    title: 'My Own Structure Challenge',
    theme: 'Design',
    morning: {
      focus: "Choose what kind of challenge you'd like to design today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 17),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 17), ['A tidying challenge', 'A timing challenge', 'A simplifying challenge']),
      },
    },
    afternoon: {
      introduction: 'Design a small organizing challenge for yourself, one you could realistically complete today.',
      activities: [
        {
          id: afternoonId(4, 17),
          type: 'creative',
          prompt: 'Design your own small organizing challenge.',
          whatToMake: 'A short challenge with a clear goal and a time limit, such as tidying one drawer in five minutes or sorting your inbox into three folders before lunch.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Notice how it felt to set your own rules instead of following someone else's.",
      activity: {
        id: nightId(4, 17),
        type: 'observation',
        prompt: 'Notice one moment today when having a clear goal made a task easier to start.',
        whatToNotice: 'The difference between starting a task with a specific goal in mind versus starting one without a clear target.',
      },
      carryForwardThought: 'Consider designing a slightly bigger challenge for yourself next week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 18),
    number: 4,
    day: 18,
    title: 'New Arrangement',
    theme: 'Experiment',
    morning: {
      focus: "Choose a familiar task you'd like to restructure today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 18),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 18), ['Change the order', 'Change the location', 'Change the timing']),
      },
    },
    afternoon: {
      introduction: 'Pick a task you normally do the same way, and try structuring it differently just for today.',
      activities: [
        {
          id: afternoonId(4, 18),
          type: 'realWorldAction',
          prompt: 'Try a different arrangement for a familiar task.',
          whatToDo: 'Choose a task you usually do in the same order, place, or time, and deliberately change one of those things today while still completing the task.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Notice whether the new arrangement worked better, worse, or about the same as your usual way.",
      carryForwardThought: 'Consider whether this new arrangement is worth keeping or whether your original way was already working well.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 19),
    number: 4,
    day: 19,
    title: 'Bring It Together',
    theme: 'Together',
    morning: {
      focus: 'Choose which part of the plan-organize-complete process you want to focus on most today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 19),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 19), ['Plan', 'Organize', 'Complete']),
      },
    },
    afternoon: {
      introduction: "Pick one task you've been putting off and take it through all three stages in order.",
      activities: [
        {
          id: afternoonId(4, 19),
          type: 'sequence',
          prompt: 'Put these three stages into the order you would use them to finish a task.',
          instructions: 'Think of a task you have been putting off, then use this order to take it from start to finish today.',
          items: ['Plan what needs to happen', 'Organize what you need', 'Complete the task'],
          correctOrder: ['Plan what needs to happen', 'Organize what you need', 'Complete the task'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to carry a task through all three stages in one day.',
      activity: {
        id: nightId(4, 19),
        type: 'rating',
        prompt: 'How complete did the task feel once you finished all three stages?',
        scaleLabel: 'Not very complete to very complete',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider using this same plan-organize-complete order for your next task.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 20),
    number: 4,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choose',
    morning: {
      focus: "Choose how you'd like to decide what to keep today.",
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 20),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(4, 20), ['Compare them', 'Test one more time', 'Just decide']),
      },
    },
    afternoon: {
      introduction: "Look back over the systems and structures you've tried this cycle and choose the one you most want to keep using.",
      activities: [
        {
          id: afternoonId(4, 20),
          type: 'choice',
          prompt: 'Which one system would you most like to keep using going forward?',
          instructions: 'Think back over this cycle: a four-step sequence, a small repeatable system, an arranging rule, or a simplified process.',
          options: options(afternoonId(4, 20), ['A four-step sequence', 'A small repeatable system', 'An arranging rule', 'A simplified process']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to settle on one system instead of trying to keep all of them going.',
      carryForwardThought: "Consider writing down the one system you chose somewhere you'll see it again this week.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
  {
    id: dayId(4, 21),
    number: 4,
    day: 21,
    title: 'My Strong Foundation',
    theme: 'Foundation',
    morning: {
      focus: 'Take a moment to look back over the full 21 days before you begin today.',
      colorCue: GREEN_CUE,
      activity: {
        id: morningId(4, 21),
        type: 'reflection',
        prompt: 'Look back over the last 21 days of structure and stability practices.',
        reflectionPrompt: 'What is one change in how you approach order, routines, or systems that you have noticed in yourself since Day 1?',
      },
    },
    afternoon: {
      introduction: "From everything you've tried this cycle, choose one or two practices you'd like to keep using.",
      activities: [
        {
          id: afternoonId(4, 21),
          type: 'multiChoice',
          prompt: 'Which practices from this cycle would you like to carry forward? Choose one or two.',
          options: options(afternoonId(4, 21), [
            'Ordering a routine',
            'Spotting a pattern',
            'Removing an unnecessary step',
            'Building a small system',
            'Reviewing a four-step process',
            'Designing your own challenge',
            'The plan-organize-complete order',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to close this cycle with one or two clear practices chosen, rather than trying to hold onto all of them.',
      activity: {
        id: nightId(4, 21),
        type: 'rating',
        prompt: 'Overall, how useful did this 21-day practice feel?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider keeping the one or two practices you chose somewhere visible as you move forward.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[4],
      closingThought: NUMBER_CLOSING_THOUGHTS[4],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 5 - Exploration / Adaptability
// ---------------------------------------------------------------------------

const NUMBER_5_DAYS: PracticeDay[] = [
  {
    id: dayId(5, 1),
    number: 5,
    day: 1,
    title: 'Change One Thing',
    theme: 'Change',
    morning: {
      focus: 'Choose how you want to approach change today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 1),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(5, 1), ['Explore', 'Experiment', 'Discover']),
      },
    },
    afternoon: {
      introduction: 'Change one small, ordinary thing about how you do something today.',
      activities: [
        {
          id: afternoonId(5, 1),
          type: 'realWorldAction',
          prompt: 'Change one small thing.',
          whatToDo: 'Pick one ordinary habit and do it slightly differently than usual, just for today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what that small change revealed about your usual routine.',
      carryForwardThought: 'Consider changing one more small thing tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 2),
    number: 5,
    day: 2,
    title: 'Take a Different Route',
    theme: 'Route',
    morning: {
      focus: 'Choose how you want to approach movement and routine today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 2),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(5, 2), ['Move', 'Explore', 'Notice']),
      },
    },
    afternoon: {
      introduction: 'Take a different route or order than usual for something you do regularly.',
      activities: [
        {
          id: afternoonId(5, 2),
          type: 'realWorldAction',
          prompt: 'Take a different route.',
          whatToDo: 'Choose something you usually do in a fixed order or path, and change the route or sequence today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you saw or felt differently by taking a different path.',
      carryForwardThought: 'Consider whether this different route is worth taking again.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 3),
    number: 5,
    day: 3,
    title: 'Five-Sense Explorer',
    theme: 'Senses',
    morning: {
      focus: 'Choose how you want to explore today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 3),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(5, 3), ['Notice', 'Explore', 'Discover']),
      },
    },
    afternoon: {
      introduction: 'Pick one sense and notice something new through it.',
      activities: [
        {
          id: afternoonId(5, 3),
          type: 'observation',
          prompt: 'Explore through one sense.',
          whatToNotice: 'Pick one sense - sight, sound, smell, touch or taste - and notice something new through it today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what that sense revealed that you might usually overlook.',
      carryForwardThought: 'Consider exploring a different sense tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 4),
    number: 5,
    day: 4,
    title: 'The Choice Wheel',
    theme: 'Choices',
    morning: {
      focus: 'Pick a few small choices to make differently today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 4),
        type: 'multiChoice',
        prompt: 'Pick one or more small choices to try today.',
        options: options(morningId(5, 4), ['Try a new drink', 'Sit somewhere different', 'Talk to someone new', 'Change your usual order of tasks']),
      },
    },
    afternoon: {
      introduction: 'Follow through on the choices you picked this morning.',
      activities: [
        {
          id: afternoonId(5, 4),
          type: 'realWorldAction',
          prompt: 'Follow through on your choices.',
          whatToDo: 'Carry out the small choice or choices you picked this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to adapt your usual choices, even in small ways.',
      carryForwardThought: 'Consider which small choice you might change again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 5),
    number: 5,
    day: 5,
    title: 'Curiosity Mission',
    theme: 'Curiosity',
    morning: {
      focus: 'Choose how you want to follow your curiosity today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 5),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(5, 5), ['Curiosity', 'Explore', 'Discover']),
      },
    },
    afternoon: {
      introduction: 'Pick something you are curious about and spend a few minutes exploring it.',
      activities: [
        {
          id: afternoonId(5, 5),
          type: 'creative',
          prompt: 'Follow your curiosity.',
          whatToMake: 'Pick something you are curious about and spend a few minutes exploring it - look it up, try it, or ask someone about it.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what following your curiosity led you to discover.',
      carryForwardThought: 'Keep one new thing you learned in mind for later.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 6),
    number: 5,
    day: 6,
    title: 'Unexpected Turn',
    theme: 'Adaptation',
    morning: {
      focus: 'Notice if something does not go exactly as planned today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 6),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Is there a plan today that might need to change along the way?',
      },
    },
    afternoon: {
      introduction: 'Imagine a small plan of yours not going as expected.',
      activities: [
        {
          id: afternoonId(5, 6),
          type: 'scenario',
          prompt: 'A small plan of yours does not go as expected.',
          scenario: 'What would you do next?',
          options: options(afternoonId(5, 6), ['Adapt the plan', 'Think it through first', 'Try again a different way']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how adaptable you were today, whether or not anything actually changed.',
      carryForwardThought: 'Keep this flexibility in mind if tomorrow brings an unexpected turn.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 7),
    number: 5,
    day: 7,
    title: 'My Explorer Map',
    theme: 'Exploration',
    morning: {
      focus: 'Look back over this week\'s exploring - change, routes, senses, choices, curiosity and adaptation.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which discovery from this week stands out to you most?',
      },
    },
    afternoon: {
      introduction: 'Choose which discovery from this week you would like to carry forward.',
      activities: [
        {
          id: afternoonId(5, 7),
          type: 'choice',
          prompt: 'Which discovery from this week would you like to carry forward?',
          options: options(afternoonId(5, 7), ['Change', 'A different route', 'The senses', 'A choice', 'Curiosity', 'Adaptation']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has explored change, routes, senses, choices, curiosity and adaptation.',
      carryForwardThought: 'Carry your chosen discovery into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 8),
    number: 5,
    day: 8,
    title: 'Familiar, Unfamiliar',
    theme: 'Perspective',
    morning: {
      focus: 'Choose a familiar place to look at with fresh eyes today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 8),
        type: 'choice',
        prompt: 'Which kind of familiar place would you like to explore differently today?',
        options: options(morningId(5, 8), ['A room in your home', 'A regular route', 'A place you visit often']),
      },
    },
    afternoon: {
      introduction: 'Go to the familiar place you chose and spend a few minutes looking at it as if you were seeing it for the first time.',
      activities: [
        {
          id: afternoonId(5, 8),
          type: 'observation',
          prompt: 'Look closely at the familiar place.',
          whatToNotice: "Three details you don't normally pay attention to - a color, a shape, or a small object.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what changed simply by looking closely at something familiar.',
      carryForwardThought: 'Even familiar things still have more in them to notice.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 9),
    number: 5,
    day: 9,
    title: 'Route Remix',
    theme: 'Reorder',
    morning: {
      focus: 'Pick a small routine you could do in a different order today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 9),
        type: 'choice',
        prompt: 'Which routine would you like to remix today?',
        options: options(morningId(5, 9), ['Getting ready in the morning', 'A household chore', 'An evening wind-down routine']),
      },
    },
    afternoon: {
      introduction: 'Think through the usual steps of the routine you chose, then plan a new order for them.',
      activities: [
        {
          id: afternoonId(5, 9, 1),
          type: 'sequence',
          prompt: 'Arrange the steps of your chosen routine in a new order you want to try.',
          instructions: 'Think of the usual steps for the routine you picked this morning. Using these four placeholders for your real steps, arrange them below in a different order than usual.',
          items: ['My usual first step', 'My usual second step', 'My usual third step', 'My usual fourth step'],
        },
        {
          id: afternoonId(5, 9, 2),
          type: 'realWorldAction',
          prompt: 'Follow through on the remix.',
          whatToDo: 'Actually do the routine in the new order you just planned.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to do something familiar in an unfamiliar order.',
      activity: {
        id: nightId(5, 9),
        type: 'rating',
        prompt: 'Rate how different the remixed order felt.',
        scaleLabel: 'Not different at all to very different',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'A different order can make a routine feel almost new.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 10),
    number: 5,
    day: 10,
    title: 'Curiosity Pair',
    theme: 'Questions',
    morning: {
      focus: 'Set an intention to notice twice today - once with your eyes, once with a question.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 10),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'What is one ordinary thing you pass by often without really looking at it?',
      },
    },
    afternoon: {
      introduction: 'Make two observations today and turn each one into a question.',
      activities: [
        {
          id: afternoonId(5, 10, 1),
          type: 'observation',
          prompt: 'Make two observations.',
          whatToNotice: "Two separate things today that you don't usually pay attention to.",
        },
        {
          id: afternoonId(5, 10, 2),
          type: 'creative',
          prompt: 'Turn your observations into questions.',
          whatToMake: "One genuine question for each of the two things you noticed - something you're actually curious about.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how asking a question changes the way you look at something.',
      carryForwardThought: 'Curiosity often starts with a single good question.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 11),
    number: 5,
    day: 11,
    title: 'Choice Experiment',
    theme: 'Experiment',
    morning: {
      focus: "Choose one small, safe option to try today that you wouldn't normally pick.",
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 11),
        type: 'choice',
        prompt: 'Which small experiment would you like to try today?',
        options: options(morningId(5, 11), ['Try an unfamiliar but safe food or drink', 'Sit or stand somewhere different than usual', 'Spend a short break in a different, ordinary way']),
      },
    },
    afternoon: {
      introduction: 'Follow through on the option you chose this morning.',
      activities: [
        {
          id: afternoonId(5, 11),
          type: 'realWorldAction',
          prompt: 'Try your chosen option.',
          whatToDo: 'Carry out the small experiment you picked, in a way that feels comfortable and ordinary.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it felt like to try something slightly different on purpose.',
      carryForwardThought: 'Small, safe experiments are an easy way to practice flexibility.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 12),
    number: 5,
    day: 12,
    title: 'Sensory Detail Hunt',
    theme: 'Senses',
    morning: {
      focus: 'Check in with how attentive you feel before you start noticing more today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 12),
        type: 'rating',
        prompt: 'Rate how attentive you usually feel to small details in everyday moments.',
        scaleLabel: 'Not attentive to very attentive',
        min: 1,
        max: 5,
      },
    },
    afternoon: {
      introduction: 'Sharpen your attention with two quick exercises. Pick one sense - sound, smell, or touch - to focus on for the second one.',
      activities: [
        {
          id: afternoonId(5, 12, 1),
          type: 'memory',
          prompt: 'Try this quick memory exercise.',
          instructions: 'Look at this list for about ten seconds, then look away and try to recall as many as you can.',
          items: ['Keys', 'Clock', 'Cup', 'Plant', 'Window'],
        },
        {
          id: afternoonId(5, 12, 2),
          type: 'observation',
          prompt: 'Now notice real details using the sense you picked.',
          whatToNotice: 'Two details you would normally miss, using the sense you chose.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how much more there was to notice once you slowed down.',
      carryForwardThought: 'The senses pick up more than we usually register.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 13),
    number: 5,
    day: 13,
    title: 'Adapt & Continue',
    theme: 'Flexibility',
    morning: {
      focus: 'Notice if a small plan changes today, and watch how you respond.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 13),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Is there something small today that might not go exactly as planned?',
      },
    },
    afternoon: {
      introduction: 'A small change happens to a plan of yours today.',
      activities: [
        {
          id: afternoonId(5, 13),
          type: 'scenario',
          prompt: 'A small part of your day changes unexpectedly.',
          scenario: 'Something you planned gets delayed or moved. What would you do?',
          options: options(afternoonId(5, 13), ['Adjust and continue', 'Pause and rethink first', 'Switch to something else for now']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how quickly you adapted, whether the change was big or small.',
      carryForwardThought: 'Adapting well is its own kind of skill.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 14),
    number: 5,
    day: 14,
    title: 'Explorer Review',
    theme: 'Review',
    morning: {
      focus: 'Look back over this past week of exploring before the day begins.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 14),
        type: 'reflection',
        prompt: 'Look back over the past week.',
        reflectionPrompt: 'Which day this week asked you to notice, try, or change something?',
      },
    },
    afternoon: {
      introduction: "Choose which of this week's explorations felt most interesting to you.",
      activities: [
        {
          id: afternoonId(5, 14),
          type: 'multiChoice',
          prompt: "Which of this week's explorations felt most interesting? (choose one or two)",
          options: options(afternoonId(5, 14), [
            'Looking at a familiar place differently',
            'Remixing a routine',
            'Pairing observations with questions',
            'Trying a small safe experiment',
            'The sensory detail hunt',
            'Adapting to a small change',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Notice what this week's choices tell you about how you like to explore.",
      activity: {
        id: nightId(5, 14),
        type: 'rating',
        prompt: 'Rate how engaging this week of exploring felt overall.',
        scaleLabel: 'Not engaging to very engaging',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry your favorite kind of exploration into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 15),
    number: 5,
    day: 15,
    title: 'Combine & Explore',
    theme: 'Combine',
    morning: {
      focus: 'Choose to pair curiosity with a small change today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 15),
        type: 'choice',
        prompt: 'Which pairing would you like to try today?',
        options: options(morningId(5, 15), ["Notice something new on a route you've changed before", 'Ask yourself a question about a routine you remixed', "Look closely at a place you've already looked at differently"]),
      },
    },
    afternoon: {
      introduction: "Combine two things you've practiced: noticing something closely, and changing something small.",
      activities: [
        {
          id: afternoonId(5, 15, 1),
          type: 'creative',
          prompt: 'Plan your combination.',
          whatToMake: 'A simple plan for combining noticing something closely with changing one small thing today - for example, changing your route and then noticing three new details along it.',
        },
        {
          id: afternoonId(5, 15, 2),
          type: 'realWorldAction',
          prompt: 'Carry out your plan.',
          whatToDo: 'Follow through on the small combination you just planned.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how combining two small practices felt different from doing just one.',
      carryForwardThought: 'Small practices often work better paired together.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 16),
    number: 5,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: "Recall one exploration from this cycle you'd like to try again, slightly different.",
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 16),
        type: 'reflection',
        prompt: 'Think back over this cycle.',
        reflectionPrompt: 'Which earlier exploration would be worth revisiting, with one small change?',
      },
    },
    afternoon: {
      introduction: 'Think about how you could adapt the exploration you recalled this morning, then put one idea into action.',
      activities: [
        {
          id: afternoonId(5, 16, 1),
          type: 'sort',
          prompt: 'Sort these possible ways to adapt your exploration.',
          instructions: 'Decide which ideas feel doable today and which feel better saved for later.',
          items: [
            'Try it at a different time of day',
            'Do it in a different order',
            'Try it in a new location',
            'Do it with a small twist added',
            'Do it more slowly than before',
          ],
          categories: ['Try today', 'Save for later'],
        },
        {
          id: afternoonId(5, 16, 2),
          type: 'realWorldAction',
          prompt: 'Act on one adaptation.',
          whatToDo: "Pick one idea you sorted into 'Try today' and actually do your adapted exploration.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what changed the second time around.',
      carryForwardThought: 'Revisiting with a small change often reveals something new.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 17),
    number: 5,
    day: 17,
    title: 'My Own Exploration Challenge',
    theme: 'Create',
    morning: {
      focus: 'Set aside a few minutes today to design your own small curiosity challenge.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 17),
        type: 'choice',
        prompt: 'What kind of challenge would you like to design today?',
        options: options(morningId(5, 17), ['A noticing challenge', 'A trying-something-new challenge', 'A changing-the-routine challenge']),
      },
    },
    afternoon: {
      introduction: 'Design and carry out your own short curiosity mission.',
      activities: [
        {
          id: afternoonId(5, 17, 1),
          type: 'creative',
          prompt: 'Design your own curiosity mission.',
          whatToMake: "A short, specific challenge for yourself today - something to notice, try, or change that you haven't done yet in this cycle.",
        },
        {
          id: afternoonId(5, 17, 2),
          type: 'realWorldAction',
          prompt: 'Carry out your mission.',
          whatToDo: 'Follow through on the challenge you just designed.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it felt like to set your own challenge instead of following one.',
      activity: {
        id: nightId(5, 17),
        type: 'rating',
        prompt: 'Rate how it felt to design your own challenge.',
        scaleLabel: 'Not enjoyable to very enjoyable',
        min: 1,
        max: 5,
      },
      carryForwardThought: "Designing your own challenges is a sign you're ready for more independent exploration.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 18),
    number: 5,
    day: 18,
    title: 'New Way Forward',
    theme: 'Fresh Start',
    morning: {
      focus: 'Choose one familiar activity to do in a new way today.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 18),
        type: 'choice',
        prompt: 'Which familiar activity would you like to try differently today?',
        options: options(morningId(5, 18), ['A regular task at home', 'A regular way you relax', 'A regular way you get somewhere']),
      },
    },
    afternoon: {
      introduction: 'Come up with a new way to do the familiar activity you chose this morning, then try it.',
      activities: [
        {
          id: afternoonId(5, 18, 1),
          type: 'creative',
          prompt: 'Think of a new way.',
          whatToMake: 'One specific, different way to do the familiar activity you chose this morning.',
        },
        {
          id: afternoonId(5, 18, 2),
          type: 'realWorldAction',
          prompt: 'Try it out.',
          whatToDo: 'Do the activity using the new way you just thought of.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the new way felt better, worse, or just different.',
      carryForwardThought: 'Not every new way needs to be better - just worth trying once.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 19),
    number: 5,
    day: 19,
    title: 'Bring It Together',
    theme: 'Integrate',
    morning: {
      focus: 'Set your approach for combining three skills today: noticing, choosing, and adapting.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 19),
        type: 'choice',
        prompt: 'Which would you like to lead with today?',
        options: options(morningId(5, 19), ['Noticing first', 'Choosing first', 'Adapting first']),
      },
    },
    afternoon: {
      introduction: 'Practice all three skills today: notice something, make a choice, and adapt to a change.',
      activities: [
        {
          id: afternoonId(5, 19, 1),
          type: 'observation',
          prompt: 'Notice something.',
          whatToNotice: "One detail in your day that you'd normally overlook.",
        },
        {
          id: afternoonId(5, 19, 2),
          type: 'logic',
          prompt: 'Decide which approach fits best right now.',
          options: options(afternoonId(5, 19, 2), ['Try something slightly different', 'Stick with the familiar, on purpose', 'Decide quickly instead of overthinking']),
        },
        {
          id: afternoonId(5, 19, 3),
          type: 'scenario',
          prompt: 'Adapt to a change.',
          scenario: 'Something about your day shifts slightly without warning.',
          options: options(afternoonId(5, 19, 3), ['Adjust right away', 'Take a moment, then adjust', 'Treat it as a small experiment']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to use all three skills in a single day.',
      carryForwardThought: 'Noticing, choosing, and adapting work well as a set.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 20),
    number: 5,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choose',
    morning: {
      focus: "Think about which exploration habit from this cycle you'd most like to keep.",
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 20),
        type: 'reflection',
        prompt: 'Think back over this cycle.',
        reflectionPrompt: 'Which habit from these three weeks felt most natural to you - noticing, trying new things, changing routines, or adapting to change?',
      },
    },
    afternoon: {
      introduction: 'Choose one exploration habit to focus on keeping going forward.',
      activities: [
        {
          id: afternoonId(5, 20),
          type: 'multiChoice',
          prompt: 'Which exploration habit would you like to keep practicing? (choose one or two)',
          options: options(afternoonId(5, 20), ['Noticing small details', 'Trying safe new things', 'Changing the order of routines', 'Adapting to small changes', 'Asking curious questions']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to choose on purpose, rather than letting it happen by chance.',
      activity: {
        id: nightId(5, 20),
        type: 'rating',
        prompt: 'Rate how confident you feel about continuing this habit.',
        scaleLabel: 'Not confident to very confident',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'A habit you choose on purpose is easier to keep.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
  {
    id: dayId(5, 21),
    number: 5,
    day: 21,
    title: 'My Explorer Map',
    theme: 'Continue',
    morning: {
      focus: 'Take a few minutes to look back over the whole 21-day cycle before the day begins.',
      colorCue: BLUE_CUE,
      activity: {
        id: morningId(5, 21),
        type: 'reflection',
        prompt: 'Look back over the full 21 days.',
        reflectionPrompt: 'What stands out most when you think back over this entire cycle?',
      },
    },
    afternoon: {
      introduction: "Choose one or two practices from this cycle that you'd like to keep using.",
      activities: [
        {
          id: afternoonId(5, 21),
          type: 'multiChoice',
          prompt: 'Which practices from this cycle would you like to carry forward? (choose one or two)',
          options: options(afternoonId(5, 21), [
            'Changing one small thing',
            'Adapting to the unexpected',
            'Looking at familiar things differently',
            'Remixing a routine',
            'Pairing observations with questions',
            'Trying a small safe experiment',
            'Designing your own curiosity challenge',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: "Notice how far you've come from Day 1 to today.",
      activity: {
        id: nightId(5, 21),
        type: 'rating',
        prompt: 'Rate how useful this 21-day practice felt overall.',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: "Keep exploring - curiosity doesn't need a reason.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[5],
      closingThought: NUMBER_CLOSING_THOUGHTS[5],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 6 - Appreciation / Care
// ---------------------------------------------------------------------------

const NUMBER_6_DAYS: PracticeDay[] = [
  {
    id: dayId(6, 1),
    number: 6,
    day: 1,
    title: 'The Appreciation Switch',
    theme: 'Appreciation',
    morning: {
      focus: 'Choose where you would like to direct appreciation today.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 1),
        type: 'choice',
        prompt: 'What would you like to appreciate today?',
        options: options(morningId(6, 1), ['Something around me', 'Someone I know', 'Something about myself', 'Something in the world']),
      },
    },
    afternoon: {
      introduction: 'Choose one way to express that appreciation.',
      activities: [
        {
          id: afternoonId(6, 1),
          type: 'choice',
          prompt: 'How would you like to express it?',
          options: options(afternoonId(6, 1), ['Say thank you', 'Give a compliment', 'Offer small help', 'Send a kind message', 'Do a considerate action', 'Just notice it quietly']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to express - or simply notice - appreciation today.',
      carryForwardThought: 'Consider appreciating something new tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 2),
    number: 6,
    day: 2,
    title: 'A Little Help',
    theme: 'Help',
    morning: {
      focus: 'Choose where a little help is needed today.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 2),
        type: 'choice',
        prompt: 'Where would you like to offer a little help today?',
        options: options(morningId(6, 2), ['Help someone', 'Help your space', 'Help yourself']),
      },
    },
    afternoon: {
      introduction: 'Carry out one small act of help, based on your choice this morning.',
      activities: [
        {
          id: afternoonId(6, 2),
          type: 'realWorldAction',
          prompt: 'Offer a little help.',
          whatToDo: 'Carry out one small act of help in the area you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to help, even in a small way.',
      carryForwardThought: 'Consider whether another small act of help fits tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 3),
    number: 6,
    day: 3,
    title: 'The Careful Choice',
    theme: 'Thoughtful Choice',
    morning: {
      focus: 'Notice everyday situations today where a thoughtful response matters.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 3),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'What is one everyday situation where a thoughtful response could make a small difference?',
      },
    },
    afternoon: {
      introduction: 'Consider a situation like this and how you might respond.',
      activities: [
        {
          id: afternoonId(6, 3),
          type: 'scenario',
          prompt: 'Someone nearby seems tired, or a shared space is a little messy.',
          scenario: 'What feels like the most thoughtful response right now?',
          options: options(afternoonId(6, 3), ['Say something kind', 'Offer practical help', 'Simply give them space']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which response felt most natural to you, and why.',
      carryForwardThought: 'Consider what else you could have done, for next time.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 4),
    number: 6,
    day: 4,
    title: 'The Appreciation Message',
    theme: 'Expression',
    morning: {
      focus: 'Choose who or what to send appreciation toward today.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 4),
        type: 'choice',
        prompt: 'Who or what would you like to appreciate today?',
        options: options(morningId(6, 4), ['A person', 'A place', 'Nature', 'Myself']),
      },
    },
    afternoon: {
      introduction: 'Choose how you would like to express that appreciation.',
      activities: [
        {
          id: afternoonId(6, 4),
          type: 'choice',
          prompt: 'How would you like to express it?',
          options: options(afternoonId(6, 4), ['Say it out loud', 'Send a message', 'Take a helpful action', 'Keep it as a private thought']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to express - or simply hold - this appreciation.',
      carryForwardThought: 'Consider sending another appreciation message later this week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 5),
    number: 6,
    day: 5,
    title: 'The Kindness Balance',
    theme: 'Balance',
    morning: {
      focus: 'Notice both giving and receiving today, not just one side.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 5),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Where might you give something today, and where might you receive something?',
      },
    },
    afternoon: {
      introduction: 'Notice both sides of the balance as your day unfolds.',
      activities: [
        {
          id: afternoonId(6, 5),
          type: 'observation',
          prompt: 'Notice giving and receiving.',
          whatToNotice: 'Notice one thing you give to others today, and one thing you receive from someone else.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how balanced giving and receiving felt today.',
      activity: {
        id: nightId(6, 5),
        type: 'rating',
        prompt: 'How balanced did giving and receiving feel today?',
        scaleLabel: 'Mostly giving to mostly receiving',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Notice this balance again tomorrow without trying to force it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 6),
    number: 6,
    day: 6,
    title: 'The Circle of Care',
    theme: 'Connection',
    morning: {
      focus: 'Picture yourself at the centre of a circle of the people and things you value.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 6),
        type: 'reflection',
        prompt: 'Picture a circle with "Me" at the centre.',
        reflectionPrompt: 'Who and what would you place around yourself in that circle?',
      },
    },
    afternoon: {
      introduction: 'Build out your circle of care in more detail.',
      activities: [
        {
          id: afternoonId(6, 6),
          type: 'creative',
          prompt: 'Build your circle of care.',
          whatToMake: 'Sketch or list the people, places, activities and things you value around yourself.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice who and what surrounds you when you take the time to look.',
      carryForwardThought: 'Choose one part of your circle to reach out to this week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 7),
    number: 6,
    day: 7,
    title: 'My Circle of Positivity',
    theme: 'Reflection',
    morning: {
      focus: 'Look back over this week of noticing, helping, choosing thoughtfully, expressing, balancing and connecting.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which part of this week\'s care practice meant the most to you?',
      },
    },
    afternoon: {
      introduction: 'Choose the part of this week\'s practice that stood out most.',
      activities: [
        {
          id: afternoonId(6, 7),
          type: 'choice',
          prompt: 'Which part of this week stood out most?',
          options: options(afternoonId(6, 7), ['Noticed', 'Helped', 'Considered', 'Expressed appreciation', 'Gave or received', 'Noticed a connection']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has practised appreciation, help, thoughtful choices, expression, balance and connection.',
      carryForwardThought: 'Carry your favourite part of this week forward into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 8),
    number: 6,
    day: 8,
    title: 'Notice the Good',
    theme: 'Noticing',
    morning: {
      focus: 'Set an intention to notice small good things as they happen today.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 8),
        type: 'observation',
        prompt: 'Keep a light awareness through the day.',
        whatToNotice: 'Three small good things, no matter how ordinary - a comfortable chair, a kind word, a task that went smoothly.',
      },
    },
    afternoon: {
      introduction: 'Capture what you noticed.',
      activities: [
        {
          id: afternoonId(6, 8),
          type: 'creative',
          prompt: 'Capture your three good things.',
          whatToMake: 'Write, sketch or list the three good things you noticed, in the order they happened.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to go looking for good things instead of waiting for them.',
      carryForwardThought: 'Tomorrow, try noticing a fourth one.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 9),
    number: 6,
    day: 9,
    title: 'Care in Action',
    theme: 'Action',
    morning: {
      focus: 'Decide on one small way to turn appreciation into action today.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 9),
        type: 'choice',
        prompt: 'Where would you like to direct a small act of care today?',
        options: options(morningId(6, 9), ['With someone else', 'On my own', 'Something non-human']),
      },
    },
    afternoon: {
      introduction: 'Follow through on the path that matches your choice above.',
      activities: [
        {
          id: afternoonId(6, 9, 1),
          type: 'realWorldAction',
          prompt: 'With someone else',
          whatToDo: 'Do one small practical thing that helps or supports another person today - if no one is nearby, decide exactly who and when.',
          requiresMorningOptionId: `${morningId(6, 9)}-1`,
        },
        {
          id: afternoonId(6, 9, 2),
          type: 'realWorldAction',
          prompt: 'On my own',
          whatToDo: 'Do one small practical thing of care for yourself today - rest, a meal, a task you have been putting off.',
          requiresMorningOptionId: `${morningId(6, 9)}-2`,
        },
        {
          id: afternoonId(6, 9, 3),
          type: 'realWorldAction',
          prompt: 'Something non-human',
          whatToDo: 'Tend to a plant, pet, space or object that could use a little care or attention.',
          requiresMorningOptionId: `${morningId(6, 9)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice the difference between appreciating something and actually doing something about it.',
      carryForwardThought: 'Consider which kind of action came more naturally to you.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 10),
    number: 6,
    day: 10,
    title: 'Receive with Ease',
    theme: 'Receiving',
    morning: {
      focus: 'Turn your attention toward support, not just the care you give.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 10),
        type: 'reflection',
        prompt: 'Think about the support already around you.',
        reflectionPrompt: 'What is one form of support - help, kindness, a resource - that is available to you right now, if you let yourself accept it?',
      },
    },
    afternoon: {
      introduction: 'Practice accepting that support.',
      activities: [
        {
          id: afternoonId(6, 10),
          type: 'realWorldAction',
          prompt: 'Accept support.',
          whatToDo: 'Let yourself accept or ask for that one piece of support today, instead of managing alone.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to receive rather than give.',
      activity: {
        id: nightId(6, 10),
        type: 'rating',
        prompt: 'How comfortable did it feel to let yourself receive support today?',
        scaleLabel: 'Very uncomfortable to very comfortable',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider whether accepting help is something you tend to avoid.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 11),
    number: 6,
    day: 11,
    title: 'Appreciation Detail',
    theme: 'Detail',
    morning: {
      focus: 'Pick one thing you appreciate and look closer at it.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 11),
        type: 'logic',
        prompt: 'Think of something you appreciate. Which question gets closest to the real reason it matters to you?',
        options: options(morningId(6, 11), ['Does it help me in some way?', 'Does it simply feel good?', 'Does it remind me of someone or something?', 'Is it just familiar and easy?']),
      },
    },
    afternoon: {
      introduction: 'Narrow down exactly what makes it meaningful.',
      activities: [
        {
          id: afternoonId(6, 11),
          type: 'sort',
          prompt: 'Sort these possible reasons by how much they apply to the thing you picked.',
          instructions: 'Place each reason into the category that best fits why your chosen thing matters to you.',
          items: ['It helps me', 'It feels good', 'It looks or sounds good', 'It reminds me of someone or something', 'It saves me time or effort', 'It is simply familiar'],
          categories: ['Fits well', 'Does not fit'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how specific you were able to get.',
      carryForwardThought: 'Consider naming this specific detail out loud next time you appreciate something.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 12),
    number: 6,
    day: 12,
    title: 'Balanced Care',
    theme: 'Balance',
    morning: {
      focus: 'Plan a small act of care for yourself and a small act of care that reaches outward.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 12),
        type: 'multiChoice',
        prompt: 'Choose one action for yourself and one for someone else today.',
        instructions: 'Pick at least one option that cares for you and at least one that reaches toward someone else.',
        options: options(morningId(6, 12), ['Rest or recover', 'Do something enjoyable', 'Finish a task that is draining me', 'Give a compliment', 'Offer small help', 'Share something useful', 'Send a kind message']),
      },
    },
    afternoon: {
      introduction: 'Carry out the two actions you chose.',
      activities: [
        {
          id: afternoonId(6, 12),
          type: 'realWorldAction',
          prompt: 'Follow through on both.',
          whatToDo: 'Complete the self-care action and the outward action you chose. If no one is around for the outward one, write down exactly who you would offer it to and when.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether one of the two actions felt easier than the other.',
      activity: {
        id: nightId(6, 12),
        type: 'choice',
        prompt: 'Which action would you like to repeat tomorrow?',
        options: options(nightId(6, 12), ['Caring for myself', 'Caring outward']),
      },
      carryForwardThought: 'Consider why giving or receiving care might feel uneven for you.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 13),
    number: 6,
    day: 13,
    title: 'Circle Expansion',
    theme: 'Expansion',
    morning: {
      focus: 'Look for a source of appreciation outside your usual circle.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 13),
        type: 'pattern',
        prompt: 'Choose one category that has not shown up yet, to focus on today.',
        instructions: 'This is a sample of the kinds of things already appreciated this cycle.',
        sequence: ['A person', 'A place', 'Something about myself'],
        options: options(morningId(6, 13), ['An object I use often', 'The wider world around me', 'A habit or routine', 'Something non-human, like a pet or plant']),
      },
    },
    afternoon: {
      introduction: 'Add it to your circle of care.',
      activities: [
        {
          id: afternoonId(6, 13),
          type: 'creative',
          prompt: 'Expand your circle.',
          whatToMake: 'Add this new person, place or thing to the circle of care you built earlier in this cycle - or sketch a fresh circle if you prefer, with this new addition included.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how your circle looks with one more thing in it.',
      carryForwardThought: 'Consider keeping an eye out for more things worth adding.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 14),
    number: 6,
    day: 14,
    title: 'Appreciation Review',
    theme: 'Review',
    morning: {
      focus: 'Look back over the past week of noticing and caring.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 14),
        type: 'memory',
        prompt: "Recall this week's practice.",
        instructions: 'Think back over days 8 to 13 before choosing.',
        items: ['Noticing small good things', 'Taking one caring action', 'Accepting support', 'Looking closely at what matters', 'Balancing care for self and others', 'Adding something new to my circle'],
      },
    },
    afternoon: {
      introduction: 'Decide which part of the week stood out most.',
      activities: [
        {
          id: afternoonId(6, 14),
          type: 'choice',
          prompt: 'Which part of this week felt most meaningful to you?',
          options: options(afternoonId(6, 14), ['Noticing small good things', 'Taking one caring action', 'Accepting support', 'Looking closely at what matters', 'Balancing care for self and others', 'Adding something new to my circle']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what made that part stand out from the rest.',
      activity: {
        id: nightId(6, 14),
        type: 'rating',
        prompt: 'How connected did you feel to your own appreciation practice this week?',
        scaleLabel: 'Not very connected to very connected',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry the part that stood out most into the coming week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 15),
    number: 6,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Combination',
    morning: {
      focus: 'Choose one thing to appreciate today, with the intention of acting on it.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 15),
        type: 'choice',
        prompt: 'What would you like to appreciate and act on today?',
        options: options(morningId(6, 15), ['Something around me', 'Someone I know', 'Something about myself', 'Something in the world']),
      },
    },
    afternoon: {
      introduction: 'Match that appreciation to a fitting action.',
      activities: [
        {
          id: afternoonId(6, 15),
          type: 'sort',
          prompt: 'Sort these ways of expressing appreciation by how well they fit what you chose this morning.',
          instructions: 'There is no single right pairing - sort by what feels like the best fit today.',
          items: ['Say thank you', 'Give a compliment', 'Offer small help', 'Send a kind message', 'Do a considerate action', 'Spend time with it or on it'],
          categories: ['Good fit', 'Not a fit today'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to pair noticing with doing, instead of treating them separately.',
      carryForwardThought: 'Consider making this pairing a habit.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 16),
    number: 6,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adaptation',
    morning: {
      focus: 'Choose one earlier practice from this cycle to make your own.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 16),
        type: 'scenario',
        scenario: 'You have tried several care and appreciation practices so far this cycle - noticing good things, building a circle of care, taking care action, receiving support, balancing care.',
        prompt: 'Which one feels closest to working for you, but just needs a small adjustment?',
        options: options(morningId(6, 16), ['The appreciation switch (Day 1)', 'The circle of care (Day 6)', 'Care in action (Day 9)', 'Receiving with ease (Day 10)', 'Balanced care (Day 12)']),
      },
    },
    afternoon: {
      introduction: 'Adapt it to fit you better.',
      activities: [
        {
          id: afternoonId(6, 16),
          type: 'creative',
          prompt: 'Personalize the practice you chose.',
          whatToMake: 'Rewrite or redesign that practice in your own words - change the timing, the action or the focus so it fits your life better.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the adapted version feels more natural than the original.',
      carryForwardThought: 'Keep the adapted version if it suits you better.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 17),
    number: 6,
    day: 17,
    title: 'My Own Care Challenge',
    theme: 'Creation',
    morning: {
      focus: 'Design a short appreciation activity you could repeat anytime.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 17),
        type: 'creative',
        prompt: 'Design a five-minute appreciation activity.',
        whatToMake: 'Create a short activity, no longer than five minutes, that helps you notice or express appreciation. Give it clear steps.',
      },
    },
    afternoon: {
      introduction: 'Try out the activity you designed.',
      activities: [
        {
          id: afternoonId(6, 17),
          type: 'realWorldAction',
          prompt: 'Test your activity.',
          whatToDo: 'Spend five minutes actually doing the activity you designed this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what worked and what you would change.',
      activity: {
        id: nightId(6, 17),
        type: 'observation',
        prompt: 'Keep a light eye on this over the next day or two.',
        whatToNotice: 'Whether you naturally return to this five-minute activity without being reminded.',
      },
      carryForwardThought: 'Keep refining this activity until it feels exactly right for you.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 18),
    number: 6,
    day: 18,
    title: 'A New Way to Show Care',
    theme: 'Contribution',
    morning: {
      focus: 'Consider a form of contribution that suits you naturally.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 18),
        type: 'choice',
        prompt: 'Which form of contribution feels most natural to you today?',
        options: options(morningId(6, 18), ['With someone', 'On my own', 'Something non-human']),
      },
    },
    afternoon: {
      introduction: 'Follow through on the form that fits you.',
      activities: [
        {
          id: afternoonId(6, 18, 1),
          type: 'realWorldAction',
          prompt: 'With someone',
          whatToDo: 'Offer a small, direct form of help, encouragement or kindness to someone today - if no one is available, note exactly who and when you will.',
          requiresMorningOptionId: `${morningId(6, 18)}-1`,
        },
        {
          id: afternoonId(6, 18, 2),
          type: 'realWorldAction',
          prompt: 'On my own',
          whatToDo: 'Contribute care to yourself in a way that uses one of your natural strengths or skills - a task, a skill, a bit of effort spent well.',
          requiresMorningOptionId: `${morningId(6, 18)}-2`,
        },
        {
          id: afternoonId(6, 18, 3),
          type: 'realWorldAction',
          prompt: 'Something non-human',
          whatToDo: 'Contribute care to a space, object, plant or animal that could use your attention today.',
          requiresMorningOptionId: `${morningId(6, 18)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which form of contribution felt most like you.',
      carryForwardThought: 'Consider leaning into that natural form more often.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 19),
    number: 6,
    day: 19,
    title: 'Bring It Together',
    theme: 'Integration',
    morning: {
      focus: "Set yourself up to move through today's three steps: notice, appreciate, act.",
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 19),
        type: 'sequence',
        prompt: "Put today's three steps in the order that makes sense.",
        instructions: 'Arrange these three steps into the order for turning a small good thing into a caring action.',
        items: ['Act on it in some way', 'Notice something good', 'Appreciate it, out loud or quietly'],
        correctOrder: ['Notice something good', 'Appreciate it, out loud or quietly', 'Act on it in some way'],
      },
    },
    afternoon: {
      introduction: 'Walk through the three steps for real.',
      activities: [
        {
          id: afternoonId(6, 19),
          type: 'realWorldAction',
          prompt: 'Complete the sequence.',
          whatToDo: 'Notice one good thing, appreciate it in whatever way fits, then follow it with one small action - toward yourself, someone else, or something non-human, whichever fits the moment.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how the three steps felt linked together rather than separate.',
      carryForwardThought: 'Consider using this three-step sequence again this week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 20),
    number: 6,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choice',
    morning: {
      focus: 'Look across everything you have practiced and consider what to keep.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 20),
        type: 'rating',
        prompt: 'Rate how natural appreciation has become for you over this cycle.',
        scaleLabel: 'Not natural at all to very natural',
        min: 1,
        max: 5,
      },
    },
    afternoon: {
      introduction: 'Choose one habit to commit to going forward.',
      activities: [
        {
          id: afternoonId(6, 20),
          type: 'choice',
          prompt: 'Which appreciation habit would you like to keep going forward?',
          options: options(afternoonId(6, 20), ['Noticing small good things daily', 'Pairing appreciation with one action', 'Checking in on who or what supports me', 'Balancing care for myself and others', 'Adding something new to my circle regularly']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to choose one habit instead of trying to hold onto everything.',
      activity: {
        id: nightId(6, 20),
        type: 'choice',
        prompt: 'How sure do you feel about the habit you chose this afternoon?',
        options: options(nightId(6, 20), ['Yes, keep it', 'Maybe, I will adjust it', 'Not sure yet']),
      },
      carryForwardThought: 'Give this one habit a fair trial over the next week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
  {
    id: dayId(6, 21),
    number: 6,
    day: 21,
    title: 'My Circle of Positivity',
    theme: 'Continuation',
    morning: {
      focus: 'Look back over the full 21 days and take stock of what this practice gave you.',
      colorCue: PINK_CUE,
      activity: {
        id: morningId(6, 21),
        type: 'reflection',
        prompt: 'Think back over the whole 21-day cycle.',
        reflectionPrompt: 'What changed, however slightly, in how you notice and express appreciation over these 21 days?',
      },
    },
    afternoon: {
      introduction: 'Choose what to carry forward from the whole cycle.',
      activities: [
        {
          id: afternoonId(6, 21),
          type: 'multiChoice',
          prompt: 'Pick one or two practices from this cycle to carry forward.',
          instructions: 'Choose up to two.',
          options: options(afternoonId(6, 21), ['Noticing small good things daily', 'The circle of care', 'Pairing appreciation with one action', 'Accepting support when it is offered', 'Balancing care for myself and others', 'My five-minute appreciation activity', 'Checking in on what specifically matters to me']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to close one cycle while keeping a piece of it with you.',
      activity: {
        id: nightId(6, 21),
        type: 'rating',
        prompt: 'How useful did this 21-day practice feel overall?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Begin the next cycle carrying forward what you chose today.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[6],
      closingThought: NUMBER_CLOSING_THOUGHTS[6],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 7 - Observation / Curiosity / Discovery
// ---------------------------------------------------------------------------

const NUMBER_7_DAYS: PracticeDay[] = [
  {
    id: dayId(7, 1),
    number: 7,
    day: 1,
    title: 'The Quiet Observer',
    theme: 'Observe',
    morning: {
      focus: 'Set an intention to notice something you normally pass by without seeing.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 1),
        type: 'observation',
        prompt: 'Notice something you normally walk past.',
        whatToNotice: 'Find one thing you pass by every day without really seeing it.',
      },
    },
    afternoon: {
      introduction: 'Look again at that thing with closer attention.',
      activities: [
        {
          id: afternoonId(7, 1),
          type: 'observation',
          prompt: 'Look again.',
          whatToNotice: 'What else do you notice about it now that you are paying closer attention?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how much a familiar thing can still hold, once you really look.',
      carryForwardThought: 'Choose one more overlooked thing to notice tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 2),
    number: 7,
    day: 2,
    title: 'Look Beyond the Obvious',
    theme: 'Question',
    morning: {
      focus: 'Be ready to look twice at something that seems obvious today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 2),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'What might you see today that deserves a second look rather than a first assumption?',
      },
    },
    afternoon: {
      introduction: 'Pick something that seemed obvious and consider another interpretation.',
      activities: [
        {
          id: afternoonId(7, 2),
          type: 'scenario',
          prompt: 'You notice something today that seems perfectly obvious.',
          scenario: 'Is there another way to interpret it?',
          options: options(afternoonId(7, 2), ['There is another explanation', 'It really is what it seems', "I'm not sure yet, and that's okay"]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how often a second interpretation is worth considering.',
      carryForwardThought: 'Keep this habit of a second look for tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 3),
    number: 7,
    day: 3,
    title: 'The Memory Pattern',
    theme: 'Remember',
    morning: {
      focus: 'Give your memory a short, gentle workout this morning.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 3),
        type: 'memory',
        prompt: 'Take a few seconds to look at these symbols, then look away and see what you remember.',
        items: ['★', '●', '▲', '■', '♦', '◆', '☆'],
      },
    },
    afternoon: {
      introduction: 'Carry that same attentiveness into something you encounter later today.',
      activities: [
        {
          id: afternoonId(7, 3),
          type: 'observation',
          prompt: 'Notice and remember.',
          whatToNotice: 'Pick a small detail later today and see if you can recall it clearly this evening.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you remembered, and what slipped away.',
      carryForwardThought: 'Try this kind of attentive noticing again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 4),
    number: 7,
    day: 4,
    title: 'The Clue Finder',
    theme: 'Solve',
    morning: {
      focus: 'Warm up your deduction skills with a short riddle.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 4),
        type: 'logic',
        prompt: 'Three clues: it is round, it is often found in a kitchen, and you use it to tell time while cooking. What is it?',
        options: options(morningId(7, 4), ['A clock', 'A timer', 'A plate']),
        correctOptionId: `${morningId(7, 4)}-2`,
      },
    },
    afternoon: {
      introduction: 'Carry that same deductive thinking into a small question in your own day.',
      activities: [
        {
          id: afternoonId(7, 4),
          type: 'reflection',
          prompt: 'Apply the same thinking.',
          reflectionPrompt: 'Is there a small mystery or question in your day today that a few clues could help you solve?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to work something out step by step from a few small clues.',
      carryForwardThought: 'Keep this clue-finding approach in mind for a question tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 5),
    number: 7,
    day: 5,
    title: 'What Comes Next?',
    theme: 'Predict',
    morning: {
      focus: 'Warm up your pattern recognition with a short number sequence.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 5),
        type: 'pattern',
        prompt: 'What comes next: 1, 2, 4, 8, ?',
        sequence: ['1', '2', '4', '8'],
        options: options(morningId(7, 5), ['12', '16', '10']),
        correctOptionId: `${morningId(7, 5)}-2`,
      },
    },
    afternoon: {
      introduction: 'Try one more sequence - this time, watch closely for a change in the rule partway through.',
      activities: [
        {
          id: afternoonId(7, 5),
          type: 'pattern',
          prompt: 'What comes next: 1, 2, 4, 7, 11, ?',
          sequence: ['1', '2', '4', '7', '11'],
          options: options(afternoonId(7, 5), ['14', '15', '16']),
          correctOptionId: `${afternoonId(7, 5)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt when the pattern\'s rule changed partway through.',
      carryForwardThought: 'Notice one more everyday pattern tomorrow, and whether it stays consistent.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 6),
    number: 7,
    day: 6,
    title: 'The Question Trail',
    theme: 'Investigate',
    morning: {
      focus: 'Be ready to investigate a small mystery today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 6),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Is there something small and unexplained in your day worth looking into?',
      },
    },
    afternoon: {
      introduction: 'Imagine a simple mystery and decide what to investigate first.',
      activities: [
        {
          id: afternoonId(7, 6),
          type: 'scenario',
          prompt: 'You walk into a room and notice the window is open and a book has fallen on the floor.',
          scenario: 'What would you investigate first?',
          options: options(afternoonId(7, 6), ['Check the window first', 'Check the book first', 'Ask who was last in the room']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what question you would ask next, if you could ask one more.',
      carryForwardThought: 'Carry this habit of asking a better question into tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 7),
    number: 7,
    day: 7,
    title: 'My Discovery Path',
    theme: 'Discover',
    morning: {
      focus: 'Look back over this week of observing, questioning, remembering, solving, predicting and investigating.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which part of this week\'s discovery practice did you enjoy most?',
      },
    },
    afternoon: {
      introduction: 'Choose the part of this week\'s discovery practice you enjoyed most.',
      activities: [
        {
          id: afternoonId(7, 7),
          type: 'choice',
          prompt: 'Which part of this week\'s discovery practice did you enjoy most?',
          options: options(afternoonId(7, 7), ['Observe', 'Look again', 'Remember', 'Solve', 'Find patterns', 'Ask questions']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has walked a discovery path through observing, questioning, remembering, solving, predicting and investigating.',
      carryForwardThought: 'Carry your favourite part of this discovery path into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 8),
    number: 7,
    day: 8,
    title: 'Detail Detective',
    theme: 'Detail',
    morning: {
      focus: 'Pick one ordinary object you will examine closely today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 8),
        type: 'observation',
        prompt: 'Choose one ordinary object nearby.',
        whatToNotice: 'Pick something plain and familiar - a mug, a shoe, a chair - that you will look at closely later today.',
      },
    },
    afternoon: {
      introduction: 'Now give that object your full attention.',
      activities: [
        {
          id: afternoonId(7, 8),
          type: 'observation',
          prompt: 'Examine the object you chose.',
          instructions: 'Look slowly and find five separate details about it - things like a mark, a texture, a shape, a color variation, or a small flaw.',
          whatToNotice: 'Name five distinct details about this object that you would normally overlook.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which of the five details surprised you most.',
      carryForwardThought: 'Pick a different ordinary object to examine tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 9),
    number: 7,
    day: 9,
    title: 'Observation + Question',
    theme: 'Connect',
    morning: {
      focus: 'Notice one thing closely, then let it raise questions for you.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 9),
        type: 'observation',
        prompt: 'Choose one object or scene to observe.',
        whatToNotice: 'Pick one thing and look at it closely enough to describe it in your own words.',
      },
    },
    afternoon: {
      introduction: 'Turn that observation into questions.',
      activities: [
        {
          id: afternoonId(7, 9),
          type: 'creative',
          prompt: 'Pair your observation with questions.',
          instructions: 'Think about what you observed this morning, then write down two separate questions it makes you curious about.',
          whatToMake: 'Two questions, written down, that come directly from what you observed.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which of your two questions feels more interesting to you.',
      carryForwardThought: 'Carry your more interesting question into tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 10),
    number: 7,
    day: 10,
    title: 'Memory Remix',
    theme: 'Recall',
    morning: {
      focus: 'Study a room or scene today, noticing a different kind of detail than usual.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 10),
        type: 'memory',
        prompt: 'Study a room you are in for one minute.',
        instructions: 'Instead of only looking at objects, notice these: the sounds you can hear, any smell in the air, the temperature, and the overall light in the room.',
        items: ['Sounds you can hear', 'Any smell in the air', 'The temperature', 'The quality of the light', 'One object within reach'],
      },
    },
    afternoon: {
      introduction: 'Later, without looking back, try to recall what you noticed.',
      activities: [
        {
          id: afternoonId(7, 10),
          type: 'memory',
          prompt: 'Recall the room from this morning.',
          instructions: 'Without returning to that room, try to recall each of the five things from your morning list.',
          items: ['Sounds you can hear', 'Any smell in the air', 'The temperature', 'The quality of the light', 'One object within reach'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which kind of detail - sound, smell, temperature, light, or object - was easiest and which was hardest to recall.',
      activity: {
        id: nightId(7, 10),
        type: 'memory',
        prompt: 'One more recall, before sleep.',
        instructions: 'Try recalling the same five things once more, from memory only.',
        items: ['Sounds you can hear', 'Any smell in the air', 'The temperature', 'The quality of the light', 'One object within reach'],
      },
      carryForwardThought: 'Notice a non-visual detail again tomorrow, without trying to remember it.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 11),
    number: 7,
    day: 11,
    title: 'Pattern Prediction',
    theme: 'Predict',
    morning: {
      focus: 'Stay alert for patterns today - in numbers, shapes, or routines.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 11),
        type: 'pattern',
        prompt: 'What comes next in this sequence?',
        instructions: 'Look at the shapes in order and decide which shape should come next, based on the pattern.',
        sequence: ['circle', 'square', 'circle', 'square', '?'],
        options: options(morningId(7, 11), ['circle', 'square', 'triangle']),
        correctOptionId: `${morningId(7, 11)}-1`,
      },
    },
    afternoon: {
      introduction: 'Now look for a pattern in your own day.',
      activities: [
        {
          id: afternoonId(7, 11),
          type: 'observation',
          prompt: 'Look for a repeating pattern around you.',
          whatToNotice: 'Find one pattern in your afternoon - in traffic, in a conversation, in a routine - and notice what you think will happen next.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the pattern you spotted this afternoon actually continued the way you expected.',
      carryForwardThought: 'Look for one more pattern tomorrow, and guess what comes next.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 12),
    number: 7,
    day: 12,
    title: 'Follow the Clue',
    theme: 'Follow Through',
    morning: {
      focus: 'Choose one small, answerable question to investigate today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 12),
        type: 'choice',
        prompt: 'Pick one small question you can actually answer today.',
        instructions: 'Choose a question that is specific and checkable - not a big or abstract one.',
        options: options(morningId(7, 12), [
          'How long does my commute actually take?',
          'What time does the sun set today?',
          'Which of two routes or options is faster?',
        ]),
      },
    },
    afternoon: {
      introduction: 'Go find the actual answer to your question.',
      activities: [
        {
          id: afternoonId(7, 12),
          type: 'realWorldAction',
          prompt: 'Investigate your question.',
          whatToDo: 'Spend a few minutes finding the real answer to the question you chose - check, time, measure, or look it up.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the real answer matched the guess you had before you checked.',
      carryForwardThought: 'Pick one more small, answerable question for tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 13),
    number: 7,
    day: 13,
    title: 'Look Twice',
    theme: 'Compare',
    morning: {
      focus: 'Choose one thing you will look at twice today - once quickly, once slowly.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 13),
        type: 'observation',
        prompt: 'Glance quickly at something nearby.',
        whatToNotice: 'Choose something and give it only a quick glance. Note your very first impression of it.',
      },
    },
    afternoon: {
      introduction: 'Now look at the same thing again, slower this time.',
      activities: [
        {
          id: afternoonId(7, 13),
          type: 'observation',
          prompt: 'Look at the same thing again, slowly.',
          whatToNotice: 'What do you notice now that you missed on the quick glance?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how different "quick" and "slow" attention can be on the very same thing.',
      carryForwardThought: 'Try the quick-look, slow-look pair again tomorrow on something else.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 14),
    number: 7,
    day: 14,
    title: 'Discovery Review',
    theme: 'Review',
    morning: {
      focus: 'Think back over this past week of noticing, questioning, and remembering.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 14),
        type: 'choice',
        prompt: 'Which kind of curiosity felt most engaging this week?',
        options: options(morningId(7, 14), [
          'Noticing overlooked details',
          'Turning observations into questions',
          'Remembering specific details',
          'Spotting and predicting patterns',
          'Investigating a small question',
        ]),
      },
    },
    afternoon: {
      introduction: 'Look closer at why that one stood out to you.',
      activities: [
        {
          id: afternoonId(7, 14),
          type: 'reflection',
          prompt: 'Think about your choice this morning.',
          reflectionPrompt: 'What made that kind of curiosity more engaging for you than the others?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what this tells you about how you prefer to explore.',
      activity: {
        id: nightId(7, 14),
        type: 'rating',
        prompt: 'Rate this past week of discovery practices.',
        scaleLabel: 'Not engaging at all to very engaging',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry your favorite kind of curiosity into the next week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 15),
    number: 7,
    day: 15,
    title: 'Combine & Discover',
    theme: 'Combine',
    morning: {
      focus: 'Plan to notice one thing and question it in the same moment today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 15),
        type: 'observation',
        prompt: 'Choose one ordinary thing to look at closely today.',
        whatToNotice: 'Pick something you will give a closer look later, and hold it in mind.',
      },
    },
    afternoon: {
      introduction: 'Now pair that observation with a question about it.',
      activities: [
        {
          id: afternoonId(7, 15),
          type: 'creative',
          prompt: 'Make an observation-question pair.',
          instructions: 'Write one sentence describing what you observed, then one question it raises for you.',
          whatToMake: 'One written pair: your observation, and a question it raises.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how having a question changed what you noticed while observing.',
      carryForwardThought: 'Try pairing an observation and a question again tomorrow, with something else.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 16),
    number: 7,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Adapt',
    morning: {
      focus: 'Think back to a practice from this cycle that worked well for you.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 16),
        type: 'choice',
        prompt: 'Which earlier practice do you want to revisit?',
        options: options(morningId(7, 16), [
          'Noticing an overlooked detail',
          'Investigating a small question',
          'Remembering specific details',
          'Spotting a pattern',
          'Comparing a quick and a slow look',
        ]),
      },
    },
    afternoon: {
      introduction: 'Now change it slightly and try it again, your way.',
      activities: [
        {
          id: afternoonId(7, 16),
          type: 'creative',
          prompt: 'Adapt the practice you chose.',
          instructions: 'Keep the core idea of the practice, but change the object, the setting, or the method. Then try your new version.',
          whatToMake: 'Your own adapted version of an earlier practice, tried at least once.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what changed, and what stayed useful, once you made the practice your own.',
      carryForwardThought: 'Keep adjusting practices until they fit the way you actually think.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 17),
    number: 7,
    day: 17,
    title: 'My Own Discovery Challenge',
    theme: 'Design',
    morning: {
      focus: 'Design a short discovery mission you will carry out later today.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 17),
        type: 'creative',
        prompt: 'Design a short observation mission.',
        instructions: 'Decide what you will look for, where, and for about how long - keep it small enough to finish today.',
        whatToMake: 'A short, specific plan: what to look for, where, and for how long.',
      },
    },
    afternoon: {
      introduction: 'Carry out the mission you designed this morning.',
      activities: [
        {
          id: afternoonId(7, 17),
          type: 'realWorldAction',
          prompt: 'Run your mission.',
          whatToDo: 'Complete the observation mission you designed this morning, exactly as you planned it.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to follow a mission you designed yourself, rather than one given to you.',
      activity: {
        id: nightId(7, 17),
        type: 'creative',
        prompt: 'Note one improvement.',
        whatToMake: 'One short note on what you would change about your mission design next time.',
      },
      carryForwardThought: 'Design another mission tomorrow, a little different from this one.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 18),
    number: 7,
    day: 18,
    title: 'New Angle',
    theme: 'Shift',
    morning: {
      focus: "Choose something familiar to look at from an angle you don't normally use.",
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 18),
        type: 'observation',
        prompt: 'Pick something you see every day.',
        whatToNotice: 'Choose something ordinary and decide on a new angle to view it from later - from above, below, up close, or far away.',
      },
    },
    afternoon: {
      introduction: 'Now actually look at it from that new angle.',
      activities: [
        {
          id: afternoonId(7, 18),
          type: 'observation',
          prompt: 'View the thing from your new angle.',
          whatToNotice: 'What do you notice from this new angle that you could not see before?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how much a change in angle can change what you see in something familiar.',
      carryForwardThought: 'Pick a new angle on something else tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 19),
    number: 7,
    day: 19,
    title: 'Bring It Together',
    theme: 'Integrate',
    morning: {
      focus: 'Today, combine noticing, questioning, and investigating in one sequence.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 19),
        type: 'sequence',
        prompt: 'Put these three steps in the order a discovery usually follows.',
        instructions: 'Arrange the three steps in the order they would naturally happen, from first to last.',
        items: ['Investigate to find an answer', 'Notice something worth a closer look', 'Ask a question about it'],
        correctOrder: ['Notice something worth a closer look', 'Ask a question about it', 'Investigate to find an answer'],
      },
    },
    afternoon: {
      introduction: 'Now actually do the sequence, with something real.',
      activities: [
        {
          id: afternoonId(7, 19),
          type: 'realWorldAction',
          prompt: 'Run the full sequence.',
          whatToDo: 'Pick one real thing: notice it, ask a question about it, then investigate to find an answer.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which of the three steps - noticing, questioning, or investigating - felt hardest today.',
      activity: {
        id: nightId(7, 19),
        type: 'rating',
        prompt: 'Rate how smoothly the three steps flowed together.',
        scaleLabel: 'Not smooth at all to very smooth',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Notice which step needs more practice, and give it attention tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 20),
    number: 7,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choose',
    morning: {
      focus: 'Think about which curiosity habit from this cycle is worth keeping.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 20),
        type: 'choice',
        prompt: 'Which one habit feels worth keeping going forward?',
        options: options(morningId(7, 20), [
          'Noticing overlooked details',
          'Pairing observations with questions',
          'Remembering specifics on purpose',
          'Spotting and predicting patterns',
          'Investigating small, answerable questions',
        ]),
      },
    },
    afternoon: {
      introduction: 'Practice that one habit today, on purpose.',
      activities: [
        {
          id: afternoonId(7, 20),
          type: 'realWorldAction',
          prompt: 'Practice your chosen habit.',
          whatToDo: 'Spend a few minutes today deliberately practicing the one habit you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to focus on just one habit instead of several.',
      carryForwardThought: 'Keep practicing this one habit beyond today, without needing a reminder.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
  {
    id: dayId(7, 21),
    number: 7,
    day: 21,
    title: 'My Discovery Path',
    theme: 'Continue',
    morning: {
      focus: 'Look back across the whole 21 days before choosing what comes next.',
      colorCue: INDIGO_CUE,
      activity: {
        id: morningId(7, 21),
        type: 'reflection',
        prompt: 'Look back over the full 21 days.',
        reflectionPrompt: 'What changed in the way you notice, question, remember, and explore since day one?',
      },
    },
    afternoon: {
      introduction: 'Choose one or two practices from this cycle to carry forward.',
      activities: [
        {
          id: afternoonId(7, 21),
          type: 'multiChoice',
          prompt: 'Pick one or two practices you want to keep doing beyond this cycle.',
          instructions: 'Choose up to two practices from the list below that you actually want to continue.',
          options: options(afternoonId(7, 21), [
            'Noticing one overlooked detail each day',
            'Pairing an observation with a question',
            'Recalling specific details from memory',
            'Spotting and predicting patterns',
            'Investigating one small, answerable question',
            'Comparing a quick glance with a slower look',
            'Designing your own short discovery mission',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how far your attention has traveled since day one of this cycle.',
      activity: {
        id: nightId(7, 21),
        type: 'rating',
        prompt: 'Rate how useful this 21-day discovery practice felt overall.',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry the practice or practices you chose into the days ahead, even without a plan.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[7],
      closingThought: NUMBER_CLOSING_THOUGHTS[7],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 8 - Practical Thinking / Planning / Decision
// ---------------------------------------------------------------------------

const NUMBER_8_DAYS: PracticeDay[] = [
  {
    id: dayId(8, 1),
    number: 8,
    day: 1,
    title: 'The Resource Check',
    theme: 'Resources',
    morning: {
      focus: 'Choose which resource to check in on first today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 1),
        type: 'choice',
        prompt: 'Which resource would you like to check in on first?',
        options: options(morningId(8, 1), ['Time', 'Skills', 'Things I have', 'People and support']),
      },
    },
    afternoon: {
      introduction: 'Take stock across all four areas.',
      activities: [
        {
          id: afternoonId(8, 1),
          type: 'observation',
          prompt: 'Take stock of what you have.',
          whatToNotice: 'Name one thing you have in each area: time, skills, things you own, and people or support.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you already have available that you had not fully counted before.',
      carryForwardThought: 'Keep this resource check in mind when planning tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 2),
    number: 8,
    day: 2,
    title: 'The Priority Switch',
    theme: 'Priorities',
    morning: {
      focus: 'Think about what today actually needs from you, in order of priority.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 2),
        type: 'choice',
        prompt: 'Which category feels most relevant to sort by today?',
        options: options(morningId(8, 2), ['Important', 'Time-sensitive', 'Helpful for later', 'Can wait']),
      },
    },
    afternoon: {
      introduction: 'Sort today\'s tasks using a simple four-way split.',
      activities: [
        {
          id: afternoonId(8, 2),
          type: 'realWorldAction',
          prompt: 'Sort your tasks.',
          whatToDo: 'List today\'s tasks and sort each one into NOW, NEXT, LATER, or OPTIONAL.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to see your day sorted by priority rather than by order received.',
      carryForwardThought: 'Consider starting tomorrow with the same quick sort.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 3),
    number: 8,
    day: 3,
    title: 'The Better Way',
    theme: 'Improve',
    morning: {
      focus: 'Identify one small problem worth finding a better way through.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 3),
        type: 'choice',
        prompt: 'Which approach would you like to take today?',
        options: options(morningId(8, 3), ['Think', 'Solve', 'Improve']),
      },
    },
    afternoon: {
      introduction: 'Work through a simple four-step process, even with limited time.',
      activities: [
        {
          id: afternoonId(8, 3),
          type: 'sequence',
          prompt: 'Put these four steps into their logical order.',
          items: ['Find the problem', 'Prepare a plan', 'Do it', 'Finish it'],
          correctOrder: ['Find the problem', 'Prepare a plan', 'Do it', 'Finish it'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what better way you found today, even if it was a small one.',
      carryForwardThought: 'Consider applying this better way again tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 4),
    number: 8,
    day: 4,
    title: 'The Eight-Option Challenge',
    theme: 'Options',
    morning: {
      focus: 'Pick one of eight practical directions to focus on today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 4),
        type: 'choice',
        prompt: 'Which of these eight would you like to focus on today?',
        options: options(morningId(8, 4), ['Think', 'Fix', 'Organize', 'Plan', 'Create', 'Move', 'Ask', 'Explore']),
      },
    },
    afternoon: {
      introduction: 'Act on the option you chose this morning.',
      activities: [
        {
          id: afternoonId(8, 4),
          type: 'realWorldAction',
          prompt: 'Act on your chosen option.',
          whatToDo: 'Spend a few minutes acting on the option you chose from today\'s eight.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to focus on just one practical direction out of many possible ones.',
      carryForwardThought: 'Consider trying a different option from the eight tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 5),
    number: 8,
    day: 5,
    title: 'The Goal Builder',
    theme: 'Goals',
    morning: {
      focus: 'Choose which area of your life a small goal would be useful in today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 5),
        type: 'choice',
        prompt: 'Which area would you like to set a small goal in?',
        options: options(morningId(8, 5), ['Home', 'Work or learning', 'Personal', 'Health or activity', 'Explore']),
      },
    },
    afternoon: {
      introduction: 'Build and carry out your small goal in four simple steps.',
      activities: [
        {
          id: afternoonId(8, 5),
          type: 'sequence',
          prompt: 'Put these four steps into order.',
          items: ['Choose a small goal', 'Prepare what you need', 'Do it', 'Finish it'],
          correctOrder: ['Choose a small goal', 'Prepare what you need', 'Do it', 'Finish it'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to set and work through a small, clearly-defined goal.',
      carryForwardThought: 'Consider setting one more small goal in a different area tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 6),
    number: 8,
    day: 6,
    title: 'Think Ahead',
    theme: 'Strategize',
    morning: {
      focus: 'Think about what might happen next in something you are facing today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 6),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Is there a small decision coming up for you worth thinking a step ahead on?',
      },
    },
    afternoon: {
      introduction: 'Compare your options using "if this, then that" thinking.',
      activities: [
        {
          id: afternoonId(8, 6),
          type: 'scenario',
          prompt: 'Pick the small decision you identified this morning.',
          scenario: 'What happens if you choose each option?',
          options: options(afternoonId(8, 6), ['If I choose option A, then...', 'If I choose option B, then...', 'I need more information first']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to compare options before acting, rather than deciding on the spot.',
      carryForwardThought: 'Keep this think-ahead habit in mind for tomorrow\'s decisions.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 7),
    number: 8,
    day: 7,
    title: 'My Practical Advantage',
    theme: 'Apply',
    morning: {
      focus: 'Look back over this week\'s practice of resources, priorities, improvement, strategy, goals and thinking ahead.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which of this week\'s practical skills would you like to keep using?',
      },
    },
    afternoon: {
      introduction: 'Choose which practical skill from this week to keep using.',
      activities: [
        {
          id: afternoonId(8, 7),
          type: 'choice',
          prompt: 'Which of this week\'s practical skills would you like to keep using?',
          options: options(afternoonId(8, 7), ['Use what I have', 'Set priorities', 'Improve something', 'Make better choices', 'Take small steps', 'Think ahead']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has practised using resources, setting priorities, improving, strategizing, goal-building and thinking ahead.',
      carryForwardThought: 'Carry your chosen practical advantage into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 8),
    number: 8,
    day: 8,
    title: 'Resource Remix',
    theme: 'Remix',
    morning: {
      focus: 'Pick a small problem you can try to work on using only what you already have.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 8),
        type: 'choice',
        prompt: 'Which kind of problem would you like to look at today?',
        options: options(morningId(8, 8), ['Something at home', 'Something for work or study', 'Something social']),
      },
    },
    afternoon: {
      introduction: 'Combine two things you already have to make progress on it.',
      activities: [
        {
          id: afternoonId(8, 8),
          type: 'logic',
          prompt: 'Think of two different resources you could pair together to work on this problem.',
          instructions: 'Resources include time, a skill, something you own, or a person who could help. For example, pairing a skill you have with some spare time.',
          options: options(afternoonId(8, 8), ['Pair two things I own', 'Pair a skill with spare time', 'Pair something I have with a person who could help', 'I need to think about it more']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether combining two resources made the problem feel smaller or more workable.',
      carryForwardThought: 'Keep this pairing habit in mind the next time something feels hard to solve alone.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 9),
    number: 8,
    day: 9,
    title: 'Priority + Action',
    theme: 'Next Step',
    morning: {
      focus: 'Choose one priority to work with today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 9),
        type: 'choice',
        prompt: 'Which priority would you like to focus on today?',
        options: options(morningId(8, 9), ['A task I keep putting off', 'Something that matters most this week', 'A longer-term goal']),
      },
    },
    afternoon: {
      introduction: 'Shrink that priority down to its very next concrete step.',
      activities: [
        {
          id: afternoonId(8, 9),
          type: 'scenario',
          prompt: 'Think about the very next action your chosen priority needs - nothing further ahead.',
          scenario: 'A good next step is small enough to finish in under 15 minutes.',
          instructions: 'If your idea of the next step still feels like a whole project, try breaking it down one more time before choosing.',
          options: options(afternoonId(8, 9), ['Yes, I have a next step under 15 minutes', 'Not yet - I need to shrink it further', 'I need more information before I can define it']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to have one clear next step instead of a whole project in your head.',
      carryForwardThought: 'Keep this one next step in mind as you start tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 10),
    number: 8,
    day: 10,
    title: 'Process Check',
    theme: 'Streamline',
    morning: {
      focus: 'Pick a routine you repeat often to watch closely today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 10),
        type: 'rating',
        prompt: 'Rate how automatic this routine usually feels for you.',
        scaleLabel: 'Totally automatic to very deliberate',
        min: 1,
        max: 5,
      },
    },
    afternoon: {
      introduction: 'Walk through the routine step by step as you do it.',
      activities: [
        {
          id: afternoonId(8, 10),
          type: 'observation',
          prompt: 'Notice each step of the routine while you do it.',
          whatToNotice: 'Look for one step that does not seem to add anything - something you do automatically but could skip or shorten.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you found, and whether you were doing it out of habit rather than need.',
      carryForwardThought: 'Keep an eye on that one step tomorrow and see if it is really necessary.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 11),
    number: 8,
    day: 11,
    title: 'Strategy Switch',
    theme: 'Compare',
    morning: {
      focus: 'Think of a task today that could be done in more than one way.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 11),
        type: 'choice',
        prompt: 'Which kind of task fits today?',
        options: options(morningId(8, 11), ['A task I could do quickly or carefully', 'A task I could do alone or with help', 'A task with a shortcut and a thorough way']),
      },
    },
    afternoon: {
      introduction: 'Weigh what you would gain and lose with each approach.',
      activities: [
        {
          id: afternoonId(8, 11),
          type: 'logic',
          prompt: 'Compare your two approaches for this task.',
          instructions: 'Think about speed, quality, and effort for each approach before choosing.',
          options: options(afternoonId(8, 11), ['Approach A: faster but rougher', 'Approach B: slower but more thorough', 'A mix of both']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which approach you leaned toward, and why.',
      carryForwardThought: 'Keep this comparing habit in mind before your next decision.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 12),
    number: 8,
    day: 12,
    title: 'Goal Progress',
    theme: 'Progress',
    morning: {
      focus: 'Think about which small goal feels most ready to move forward today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 12),
        type: 'reflection',
        prompt: 'Think about your current goals.',
        reflectionPrompt: 'Which goal, if moved forward even slightly today, would feel most satisfying?',
      },
    },
    afternoon: {
      introduction: 'Take one concrete action on it.',
      activities: [
        {
          id: afternoonId(8, 12),
          type: 'realWorldAction',
          prompt: 'Do one small, specific thing that moves this goal forward.',
          whatToDo: 'Keep it small enough to finish today - for example, sending one message, writing one paragraph, or organizing one shelf.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to have actually moved the goal, even by a small amount.',
      carryForwardThought: "Keep this one-step habit in mind for tomorrow's goal as well.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 13),
    number: 8,
    day: 13,
    title: 'Practical Puzzle',
    theme: 'Puzzle',
    morning: {
      focus: "Warm up with a short pattern before today's planning puzzle.",
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 13),
        type: 'pattern',
        prompt: 'What comes next in this sequence?',
        sequence: ['Plan', 'Prepare', 'Act', '?'],
        instructions: 'Think about what a practical process usually needs right after acting.',
        options: options(morningId(8, 13), ['Review', 'Repeat the plan', 'Start a new plan']),
        correctOptionId: `${morningId(8, 13)}-1`,
      },
    },
    afternoon: {
      introduction: 'Put the steps of a simple plan in working order.',
      activities: [
        {
          id: afternoonId(8, 13),
          type: 'sequence',
          prompt: 'Put these steps of a simple plan in the order you would actually do them.',
          instructions: 'Think about what needs to happen before the next step can happen.',
          items: ['Decide the goal', 'List what you need', 'Pick the first action', 'Do the first action', 'Check how it went'],
          correctOrder: ['Decide the goal', 'List what you need', 'Pick the first action', 'Do the first action', 'Check how it went'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether putting the steps in order made the plan feel clearer.',
      activity: {
        id: nightId(8, 13),
        type: 'rating',
        prompt: 'How did solving this planning puzzle feel?',
        scaleLabel: 'Frustrating to satisfying',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep this step order in mind the next time you plan something.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 14),
    number: 8,
    day: 14,
    title: 'Strategy Review',
    theme: 'Review',
    morning: {
      focus: "Look back over this week's practical practices before choosing today's focus.",
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 14),
        type: 'memory',
        prompt: 'Try to recall the different practical practices you have tried this week, before reading the list below.',
        instructions: 'Think of as many as you can first, then check which ones you remembered.',
        items: ['Resource Remix', 'Priority + Action', 'Process Check', 'Strategy Switch', 'Goal Progress', 'Practical Puzzle'],
      },
    },
    afternoon: {
      introduction: 'Pick which method felt most useful this week.',
      activities: [
        {
          id: afternoonId(8, 14),
          type: 'choice',
          prompt: 'Which practical method felt most useful to you this week?',
          options: options(afternoonId(8, 14), ['Checking what resources I had', 'Breaking a priority into a next step', 'Noticing an unnecessary step', 'Comparing two approaches', 'Moving a goal forward', 'Solving the planning puzzle']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice why that method stood out - was it the simplest one, or the one that fit a real problem you had?',
      activity: {
        id: nightId(8, 14),
        type: 'rating',
        prompt: 'How useful did this week of practical practices feel overall?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: "Carry the method you picked into next week's planning.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 15),
    number: 8,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Combine',
    morning: {
      focus: 'Think about a priority and what it would need from you, side by side.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 15),
        type: 'reflection',
        prompt: 'Think about a priority you are carrying today.',
        reflectionPrompt: "Which resource comes to mind first when you think about this priority - time, a skill, something you own, or someone else's support?",
      },
    },
    afternoon: {
      introduction: 'Match this priority to what you have available.',
      activities: [
        {
          id: afternoonId(8, 15),
          type: 'sort',
          prompt: 'Sort these resources by how much each one would help with your chosen priority.',
          instructions: 'Place each resource under how much it would help: a lot, a little, or not needed.',
          items: ['Time', 'Skills', 'Things I own', 'People or support'],
          categories: ['Helps a lot', 'Helps a little', 'Not needed'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which resource turned out to matter most once you looked closely.',
      carryForwardThought: 'Keep this pairing of priority and resource in mind this week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 16),
    number: 8,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Simplify',
    morning: {
      focus: 'Pick one earlier practice from this cycle to simplify today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 16),
        type: 'choice',
        prompt: 'Which earlier practice would you like to simplify?',
        options: options(morningId(8, 16), ['The resource check', 'The next-step habit', 'The process check', 'The comparing habit']),
      },
    },
    afternoon: {
      introduction: 'Strip it down to its simplest version.',
      activities: [
        {
          id: afternoonId(8, 16),
          type: 'creative',
          prompt: 'Redesign your chosen practice into a shorter version.',
          whatToMake: 'Write a one-line version of the practice that you could do in under a minute - short enough to actually repeat often.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether a shorter version feels more realistic to keep doing.',
      activity: {
        id: nightId(8, 16),
        type: 'observation',
        prompt: 'Notice whether you actually used your simplified version today.',
        whatToNotice: 'Did you use it, think about using it, or forget about it entirely? Just notice, without judging.',
      },
      carryForwardThought: 'Try this simplified version again before the cycle ends.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 17),
    number: 8,
    day: 17,
    title: 'My Own Practical Challenge',
    theme: 'Design',
    morning: {
      focus: 'Get a sense of how ready you feel to design your own small challenge today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 17),
        type: 'rating',
        prompt: 'Rate how ready you feel to design a small practical challenge for yourself.',
        scaleLabel: 'Not ready to very ready',
        min: 1,
        max: 5,
      },
    },
    afternoon: {
      introduction: 'Design your own small task.',
      activities: [
        {
          id: afternoonId(8, 17),
          type: 'creative',
          prompt: 'Create a small practical challenge for yourself.',
          whatToMake: 'Write one sentence describing a small task: what you will do, and roughly how long it should take.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to set your own practical task instead of following one.',
      carryForwardThought: 'Try the challenge you designed sometime in the next day or two.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 18),
    number: 8,
    day: 18,
    title: 'New Way Forward',
    theme: 'Rethink',
    morning: {
      focus: 'Pick a process you follow often and plan to look at it differently today.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 18),
        type: 'choice',
        prompt: 'Which process would you like to look at differently today?',
        options: options(morningId(8, 18), ['A process at work or study', 'A process at home', 'A process that involves other people']),
      },
    },
    afternoon: {
      introduction: 'Watch yourself doing part of it, then imagine a different way.',
      activities: [
        {
          id: afternoonId(8, 18),
          type: 'observation',
          prompt: 'Watch yourself doing part of this process.',
          whatToNotice: 'Notice one assumption you are making about how it has to be done, then imagine one different way it could work.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether that different way seems worth trying, even partly.',
      carryForwardThought: 'Keep this alternative in mind the next time this process comes up.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 19),
    number: 8,
    day: 19,
    title: 'Bring It Together',
    theme: 'Full Cycle',
    morning: {
      focus: 'Pick one small task to carry through a full cycle today: plan, choose, act, review.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 19),
        type: 'scenario',
        prompt: "You're going to carry one small task through a full cycle today.",
        scenario: 'The cycle is: plan it, choose your approach, act on it, then review how it went.',
        options: options(morningId(8, 19), ['A task at home', 'A task for work or study', 'A task involving a decision']),
      },
    },
    afternoon: {
      introduction: 'Work through the first parts of the cycle now.',
      activities: [
        {
          id: afternoonId(8, 19, 1),
          type: 'logic',
          prompt: 'Plan: what is the smallest version of this task you could do today?',
          instructions: 'Make it small enough to finish in one sitting.',
          options: options(afternoonId(8, 19, 1), ['I have a clear small version', 'It still feels too big - shrink it more']),
        },
        {
          id: afternoonId(8, 19, 2),
          type: 'realWorldAction',
          prompt: 'Act on the small version now.',
          whatToDo: 'Do the small version of the task you just planned.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Review how the plan, choose, and act sequence felt from start to finish.',
      activity: {
        id: nightId(8, 19),
        type: 'rating',
        prompt: 'How smoothly did the full cycle go today?',
        scaleLabel: 'Rough to smooth',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep this plan-act-review cycle in mind for bigger tasks too.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 20),
    number: 8,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Choose',
    morning: {
      focus: 'Recall the practical habits you have tried across this cycle before choosing one.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 20),
        type: 'memory',
        prompt: 'Try to recall the practical habits you have tried across this 21-day cycle, before reading the list below.',
        instructions: 'Think of as many as you can first, then check the list.',
        items: ['Checking my resources', 'Thinking a step ahead', 'Breaking a priority into a next step', 'Checking a routine for unnecessary steps', 'Comparing two approaches', 'Moving a goal forward'],
      },
    },
    afternoon: {
      introduction: 'Choose one practical habit to commit to.',
      activities: [
        {
          id: afternoonId(8, 20),
          type: 'choice',
          prompt: 'Which one habit would you like to choose going forward?',
          options: options(afternoonId(8, 20), ['Checking my resources before starting', 'Breaking priorities into next steps', 'Checking a routine for unnecessary steps', 'Comparing approaches before acting', 'Reviewing after I act']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to settle on just one habit instead of trying to keep all of them.',
      carryForwardThought: 'Keep practicing this one chosen habit after the cycle ends.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
  {
    id: dayId(8, 21),
    number: 8,
    day: 21,
    title: 'My Practical Advantage',
    theme: 'Cycle Review',
    morning: {
      focus: 'Look back over the full 21 days before choosing what to carry forward.',
      colorCue: DEEP_BLUE_CUE,
      activity: {
        id: morningId(8, 21),
        type: 'reflection',
        prompt: 'Look back over the last 21 days of practical practice.',
        reflectionPrompt: 'What is one thing you understand about how you plan or use resources that you did not notice three weeks ago?',
      },
    },
    afternoon: {
      introduction: 'Pick one or two practices from this cycle to keep using.',
      activities: [
        {
          id: afternoonId(8, 21),
          type: 'multiChoice',
          prompt: 'Choose one or two practices from this cycle that you want to keep using.',
          instructions: 'Pick the ones that felt most useful or realistic to keep doing - no need to pick more than two.',
          options: options(afternoonId(8, 21), ['Checking my resources first', 'Thinking a step ahead before deciding', 'Breaking a priority into one next step', 'Checking a routine for an unnecessary step', 'Comparing two approaches before acting', 'Moving a small goal forward regularly', 'Reviewing after I act']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it feels to close this 21-day cycle with a plan for what comes next.',
      activity: {
        id: nightId(8, 21),
        type: 'rating',
        prompt: 'How useful did this whole 21-day practice feel overall?',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry forward the practice or practices you chose today as your practical advantage.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[8],
      closingThought: NUMBER_CLOSING_THOUGHTS[8],
    },
  },
];

// ---------------------------------------------------------------------------
// Number 9 - Perspective / Understanding / Completion / Contribution
// ---------------------------------------------------------------------------

const NUMBER_9_DAYS: PracticeDay[] = [
  {
    id: dayId(9, 1),
    number: 9,
    day: 1,
    title: 'The Bigger Picture',
    theme: 'Perspective',
    morning: {
      focus: 'Choose something to view from a wider perspective today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 1),
        type: 'choice',
        prompt: 'What would you like to look at from a wider view today?',
        options: options(morningId(9, 1), ["Something I'm dealing with", 'Something recent', "Something I'm working toward", 'Something I noticed today']),
      },
    },
    afternoon: {
      introduction: 'Step back from your choice and consider the bigger picture around it.',
      activities: [
        {
          id: afternoonId(9, 1),
          type: 'reflection',
          prompt: 'Step back and look wider.',
          reflectionPrompt: 'What does the bigger picture around this look like, beyond today?',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the bigger picture changed how this felt up close.',
      carryForwardThought: 'Keep this wider view in mind the next time this comes up.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 2),
    number: 9,
    day: 2,
    title: 'Another Point of View',
    theme: 'Understanding',
    morning: {
      focus: 'Be ready to consider another person\'s perspective today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 2),
        type: 'reflection',
        prompt: 'Think ahead to today.',
        reflectionPrompt: 'Is there a situation today where someone else\'s perspective might differ from yours?',
      },
    },
    afternoon: {
      introduction: 'Consider a situation like this and what another point of view might look like.',
      activities: [
        {
          id: afternoonId(9, 2),
          type: 'scenario',
          prompt: 'Someone hasn\'t replied to your message, or a colleague disagreed with you.',
          scenario: 'What might their point of view be?',
          options: options(afternoonId(9, 2), ['They might be busy or distracted', 'They might see it differently than I do', "I'm not sure yet, and that's okay"]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how considering another point of view changed - or didn\'t change - how you feel.',
      carryForwardThought: 'Keep this habit of considering another view for tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 3),
    number: 9,
    day: 3,
    title: 'A Little Good',
    theme: 'Care',
    morning: {
      focus: 'Choose one small good thing to do today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 3),
        type: 'choice',
        prompt: 'Which small good thing would you like to do today?',
        options: options(morningId(9, 3), ['Help someone', 'Improve your surroundings', 'Express appreciation', 'Do something kind for yourself']),
      },
    },
    afternoon: {
      introduction: 'Carry out the small good action you chose this morning.',
      activities: [
        {
          id: afternoonId(9, 3),
          type: 'realWorldAction',
          prompt: 'Do a little good.',
          whatToDo: 'Carry out the small good action you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how a small, deliberate act of good felt to carry out.',
      carryForwardThought: 'Consider doing one more small good thing tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 4),
    number: 9,
    day: 4,
    title: 'Make Some Space',
    theme: 'Release',
    morning: {
      focus: 'Choose where you would like to make some space today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 4),
        type: 'choice',
        prompt: 'Where would you like to make some space today?',
        options: options(morningId(9, 4), ['A thought', 'An unfinished task', 'My physical space', 'My digital space', 'Something else']),
      },
    },
    afternoon: {
      introduction: 'Decide what to do with the space you are making.',
      activities: [
        {
          id: afternoonId(9, 4),
          type: 'choice',
          prompt: 'What would you like to do with it?',
          options: options(afternoonId(9, 4), ['Keep it', 'Change it', 'Release it']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to make a little room, whether by keeping, changing or releasing.',
      carryForwardThought: 'Notice tomorrow whether that space still feels clearer.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 5),
    number: 9,
    day: 5,
    title: 'Close the Loop',
    theme: 'Completion',
    morning: {
      focus: 'Choose something small worth closing a loop on today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 5),
        type: 'choice',
        prompt: 'What would you like to close a loop on today?',
        options: options(morningId(9, 5), ['A small task', 'Something in my surroundings', 'A simple follow-up', 'A decision']),
      },
    },
    afternoon: {
      introduction: 'Decide how to close this particular loop.',
      activities: [
        {
          id: afternoonId(9, 5),
          type: 'choice',
          prompt: 'How would you like to close it?',
          options: options(afternoonId(9, 5), ['Finish it', 'Continue it a little further', 'Release it']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to close - or consciously continue - something left open.',
      carryForwardThought: 'Consider closing one more small loop tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 6),
    number: 9,
    day: 6,
    title: 'Leave Something Good',
    theme: 'Contribution',
    morning: {
      focus: 'Choose where you would like to leave something good behind today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 6),
        type: 'choice',
        prompt: 'Where would you like to leave something good today?',
        options: options(morningId(9, 6), ['My surroundings', "Someone's day", 'An idea', 'Something I create', 'My future self']),
      },
    },
    afternoon: {
      introduction: 'Leave that something good behind, based on your choice this morning.',
      activities: [
        {
          id: afternoonId(9, 6),
          type: 'creative',
          prompt: 'Leave something good.',
          whatToMake: 'Leave something good behind today in the area you chose this morning.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it felt like to leave something good without expecting anything back.',
      carryForwardThought: 'Consider leaving something good again tomorrow, in a different area.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 7),
    number: 9,
    day: 7,
    title: 'My Positive Path',
    theme: 'Carry Forward',
    morning: {
      focus: 'Look back over this week\'s practice of perspective, understanding, care, release, completion and contribution.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 7),
        type: 'reflection',
        prompt: 'Think back over this week.',
        reflectionPrompt: 'Which one or two parts of this week would you most like to carry forward?',
      },
    },
    afternoon: {
      introduction: 'Choose which parts of this week you would like to carry forward.',
      activities: [
        {
          id: afternoonId(9, 7),
          type: 'multiChoice',
          prompt: 'Which one or two parts of this week would you like to carry forward?',
          options: options(afternoonId(9, 7), ['The bigger picture', 'Another point of view', 'A little good', 'Making space', 'Closing a loop', 'Leaving something good']),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'This week has walked a positive path through perspective, understanding, care, release, completion and contribution.',
      carryForwardThought: 'Carry your chosen direction forward into the days ahead.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 8),
    number: 9,
    day: 8,
    title: 'Perspective Pair',
    theme: 'Compare',
    morning: {
      focus: 'Choose something you already have an opinion about to look at again today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 8),
        type: 'choice',
        prompt: 'What would you like to reconsider today?',
        options: options(morningId(9, 8), ['Something someone said', 'Something that happened', 'A decision I made', 'Something I read or saw']),
      },
    },
    afternoon: {
      introduction: 'Hold your choice up against a second, equally reasonable way of seeing it.',
      activities: [
        {
          id: afternoonId(9, 8),
          type: 'multiChoice',
          prompt: 'Pick the two interpretations below that feel most reasonable for your situation.',
          instructions: 'These are general ways of reframing something. Pick the two that fit your chosen situation best, even if neither feels completely certain.',
          options: options(afternoonId(9, 8), [
            'It was about timing, not about me',
            'It reflects what the other person needed, not what I did',
            'It was more random than it felt',
            'It says something about the situation, not about my worth',
            'It could mean more than one thing at once',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether holding two interpretations at once changed how certain you felt about the first one.',
      carryForwardThought: 'When something feels like it only has one meaning, try finding a second one before deciding.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 9),
    number: 9,
    day: 9,
    title: 'Understand Before Concluding',
    theme: 'Pause',
    morning: {
      focus: 'Choose one kind of moment today where you will pause before deciding what it means.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 9),
        type: 'choice',
        prompt: 'Where will you practice pausing before concluding today?',
        options: options(morningId(9, 9), ['A message I receive', 'Something someone does', 'A result I get', 'A piece of news']),
      },
    },
    afternoon: {
      introduction: 'When that moment comes, work through these steps instead of concluding right away.',
      activities: [
        {
          id: afternoonId(9, 9),
          type: 'sequence',
          prompt: 'Put these steps in the order you would actually use them.',
          instructions: 'Think about what order makes the most sense for pausing before you decide what something means.',
          items: [
            'Notice you have already formed a conclusion',
            'Pause before acting on it',
            'Ask what else could explain it',
            'Decide what to do next',
          ],
          correctOrder: [
            'Notice you have already formed a conclusion',
            'Pause before acting on it',
            'Ask what else could explain it',
            'Decide what to do next',
          ],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to wait a moment longer than usual before concluding something.',
      carryForwardThought: 'Try adding that pause again the next time you catch yourself concluding quickly.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 10),
    number: 9,
    day: 10,
    title: 'Small Contribution',
    theme: 'Contribute',
    morning: {
      focus: 'Choose how you would like to make a small contribution today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 10),
        type: 'choice',
        prompt: 'How would you like to contribute today?',
        options: options(morningId(9, 10), ['With someone', 'On my own', 'For a place, idea, or my future self']),
      },
    },
    afternoon: {
      introduction: 'Carry out the small contribution you chose this morning, in the way that matches your choice.',
      activities: [
        {
          id: afternoonId(9, 10, 1),
          type: 'realWorldAction',
          prompt: 'Contribute with someone.',
          whatToDo: 'Do one small, useful thing for or with another person today - something that fits naturally into what you are already doing.',
          requiresMorningOptionId: `${morningId(9, 10)}-1`,
        },
        {
          id: afternoonId(9, 10, 2),
          type: 'realWorldAction',
          prompt: 'Contribute on your own.',
          whatToDo: 'Do one small, useful thing on your own today, for your own work or life - something that fits naturally into what you are already doing.',
          requiresMorningOptionId: `${morningId(9, 10)}-2`,
        },
        {
          id: afternoonId(9, 10, 3),
          type: 'realWorldAction',
          prompt: 'Contribute to a place, idea, or your future self.',
          whatToDo: 'Do one small, useful thing today for a place, an idea, or your future self - something that fits naturally into what you are already doing.',
          requiresMorningOptionId: `${morningId(9, 10)}-3`,
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether the contribution you made felt natural or like an effort.',
      carryForwardThought: 'Look for one more small contribution that fits naturally tomorrow.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 11),
    number: 9,
    day: 11,
    title: 'Make Space Again',
    theme: 'Clear',
    morning: {
      focus: 'Choose one small area to clear today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 11),
        type: 'choice',
        prompt: 'Which area would you like to clear today?',
        options: options(morningId(9, 11), ['A physical space', 'A list or inbox', 'A commitment', 'A digital folder']),
      },
    },
    afternoon: {
      introduction: 'Sort a few clutter patterns, then clear one real thing from the area you chose.',
      activities: [
        {
          id: afternoonId(9, 11),
          type: 'sort',
          prompt: 'Sort these clutter patterns, then clear one real item away.',
          instructions: 'Sort each pattern below into whether it tends to be easy or hard for you to let go of. Then, in the area you chose this morning, clear away one real small thing - ideally one that matches an "easy to let go" pattern.',
          items: [
            'Something you no longer use',
            'Something kept out of guilt',
            'Something you forgot you had',
            'Something that belongs somewhere else',
            'Something you might need "someday"',
          ],
          categories: ['Easy to let go', 'Hard to let go'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how the space feels now that one small thing is gone.',
      carryForwardThought: 'Clutter builds up slowly - clearing one small thing regularly keeps it from piling up again.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 12),
    number: 9,
    day: 12,
    title: 'Complete with Care',
    theme: 'Finish',
    morning: {
      focus: 'Choose one small unfinished task to complete today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 12),
        type: 'choice',
        prompt: 'Which unfinished task will you complete today?',
        options: options(morningId(9, 12), ['Something half-done', "Something I've been putting off", 'A small task I can finish in one sitting', "Something someone's waiting on"]),
      },
    },
    afternoon: {
      introduction: 'Finish that task, and add one small extra touch of care to how you complete it.',
      activities: [
        {
          id: afternoonId(9, 12),
          type: 'creative',
          prompt: 'Finish it, with one added touch of care.',
          whatToMake: "Complete the task you chose, and add one small extra touch - tidier, more thorough, or more thoughtful than you'd normally bother with.",
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice the difference between finishing something and finishing it with care.',
      activity: {
        id: nightId(9, 12),
        type: 'rating',
        prompt: 'Rate how it felt to finish with care.',
        scaleLabel: 'Rushed through it to took real care',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Consider which other unfinished things might be worth completing with the same care.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 13),
    number: 9,
    day: 13,
    title: 'Contribution Remix',
    theme: 'Remix',
    morning: {
      focus: 'Choose a different way to leave something useful behind today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 13),
        type: 'choice',
        prompt: 'What kind of thing would you like to leave behind today, in a new way?',
        options: options(morningId(9, 13), ['A piece of advice', 'A useful object', 'A kind gesture', 'An idea or tip', 'My time']),
      },
    },
    afternoon: {
      introduction: 'Leave something useful behind today, using a different method than you used earlier in this cycle.',
      activities: [
        {
          id: afternoonId(9, 13),
          type: 'realWorldAction',
          prompt: 'Leave something useful behind, a different way.',
          whatToDo: 'Leave something useful behind today in the area you chose, using a different method or form than you have used before in this cycle.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether this way of contributing felt different from the last.',
      carryForwardThought: 'Keep a mental list of different ways you can contribute, so it never feels repetitive.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 14),
    number: 9,
    day: 14,
    title: 'Positive Path Review',
    theme: 'Reflect',
    morning: {
      focus: 'Take a moment to recall this week of practice before you start today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 14),
        type: 'memory',
        prompt: 'Recall what you practiced this week.',
        instructions: "Read through this week's practices once, then try to recall them without looking, before moving on.",
        items: [
          'Day 8: Perspective Pair',
          'Day 9: Understand Before Concluding',
          'Day 10: Small Contribution',
          'Day 11: Make Space Again',
          'Day 12: Complete with Care',
          'Day 13: Contribution Remix',
        ],
      },
    },
    afternoon: {
      introduction: "Pick out which of this week's practices felt most meaningful to you.",
      activities: [
        {
          id: afternoonId(9, 14),
          type: 'multiChoice',
          prompt: "Which of this week's practices felt most meaningful to you?",
          options: options(afternoonId(9, 14), [
            'Looking at something from two interpretations',
            'Pausing before concluding',
            'Making a small contribution',
            'Clearing one small thing',
            'Completing a task with care',
            'Leaving something useful behind, a different way',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which practice you chose and what made it stand out from the rest.',
      activity: {
        id: nightId(9, 14),
        type: 'rating',
        prompt: 'Rate how meaningful this week felt overall.',
        scaleLabel: 'Not very meaningful to very meaningful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Carry the practice that stood out most into the coming week.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 15),
    number: 9,
    day: 15,
    title: 'Combine & Apply',
    theme: 'Combine',
    morning: {
      focus: 'Choose a situation where you can pair a wider perspective with a caring action today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 15),
        type: 'choice',
        prompt: 'Which situation will you bring perspective and care to today?',
        options: options(morningId(9, 15), ["A conversation I'm having", "A task I'm doing for someone", "A decision I'm making", "A situation I'm observing"]),
      },
    },
    afternoon: {
      introduction: 'Widen your view of the situation first, then pick the response that best fits what you see.',
      activities: [
        {
          id: afternoonId(9, 15),
          type: 'logic',
          prompt: 'Which response best fits the wider view you just took?',
          instructions: 'Look at your situation from a wider angle, then pick whichever response below fits it best.',
          options: options(afternoonId(9, 15), [
            'Give them more time, since they might be rushed',
            'Offer to help, since they might be overloaded',
            'Ask a question, since I might be missing context',
            'Say nothing yet, since I might be misreading it',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether pairing perspective with action felt more useful than either alone.',
      carryForwardThought: 'Try pairing a wider view with one caring action again whenever it is useful.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 16),
    number: 9,
    day: 16,
    title: 'Adapt What Works',
    theme: 'Personalize',
    morning: {
      focus: 'Choose one earlier practice from this cycle to adapt and make your own today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 16),
        type: 'choice',
        prompt: 'Which practice from this cycle will you adapt today?',
        options: options(morningId(9, 16), [
          'The bigger-picture view (Day 1)',
          'Pausing before concluding (Day 9)',
          'Leaving something useful behind (Day 6 / 13)',
          'Making space (Day 11)',
          'Completing with care (Day 12)',
        ]),
      },
    },
    afternoon: {
      introduction: 'Decide how you will adapt that practice to fit you better, then carry it out.',
      activities: [
        {
          id: afternoonId(9, 16),
          type: 'scenario',
          prompt: 'Pick how you will adapt your chosen practice today.',
          scenario: "You're adapting one of this cycle's practices so it fits you better, rather than doing it exactly as written.",
          options: options(afternoonId(9, 16), [
            'Make it shorter',
            'Make it bigger',
            'Do it at a different time of day',
            'Do it in a different place',
            'Combine it with another practice',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what you changed and whether the adapted version felt more natural.',
      activity: {
        id: nightId(9, 16),
        type: 'reflection',
        prompt: 'Think about your adaptation.',
        reflectionPrompt: 'What would make this adapted version even more yours if you kept doing it?',
      },
      carryForwardThought: 'Keep adapting practices until they feel like they fit you, not just the program.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 17),
    number: 9,
    day: 17,
    title: 'My Own Positive Challenge',
    theme: 'Create',
    morning: {
      focus: "Decide whether today's challenge will be about perspective or about contribution.",
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 17),
        type: 'choice',
        prompt: "What will today's challenge be about?",
        options: options(morningId(9, 17), ['Perspective', 'Contribution']),
      },
    },
    afternoon: {
      introduction: 'Design one small challenge of your own in the area you chose, then carry it out.',
      activities: [
        {
          id: afternoonId(9, 17),
          type: 'creative',
          prompt: 'Create your own small challenge.',
          whatToMake: 'Invent one small challenge of your own in the area you chose this morning, then carry it out today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice what it felt like to set your own challenge instead of following one.',
      activity: {
        id: nightId(9, 17),
        type: 'rating',
        prompt: 'Rate how well your challenge worked for you.',
        scaleLabel: 'Did not work well to worked very well',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Notice what made this challenge work, and use it again when designing your own practices.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 18),
    number: 9,
    day: 18,
    title: 'A New Way Forward',
    theme: 'Revisit',
    morning: {
      focus: 'Choose a familiar, recurring situation to revisit with a wider view today.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 18),
        type: 'choice',
        prompt: 'Which recurring situation will you revisit today?',
        options: options(morningId(9, 18), ['A recurring disagreement', 'A routine task', 'A regular interaction', 'A recurring reaction I have']),
      },
    },
    afternoon: {
      introduction: 'Look at that familiar situation as if seeing it for the first time, then consider what usually keeps it the same.',
      activities: [
        {
          id: afternoonId(9, 18, 1),
          type: 'observation',
          prompt: 'Observe it freshly.',
          whatToNotice: 'Watch for one detail in this familiar situation that you usually overlook because it is so routine.',
        },
        {
          id: afternoonId(9, 18, 2),
          type: 'pattern',
          prompt: 'Pick the response that would create a new way forward.',
          instructions: 'This is how the situation usually plays out. Pick the response that would make it go differently next time.',
          sequence: ['Something familiar happens', 'I react the way I always do', 'The situation plays out the same way it always has'],
          options: options(afternoonId(9, 18, 2), [
            'I notice the pattern this time, before reacting',
            'I justify my usual reaction',
            'I blame the situation itself',
            'I do nothing different',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice whether seeing the familiar situation freshly changed how you feel about it.',
      carryForwardThought: 'Revisit other familiar situations with the same fresh eyes when they come up.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 19),
    number: 9,
    day: 19,
    title: 'Bring It Together',
    theme: 'Integrate',
    morning: {
      focus: 'Pick one situation today to carry all the way through: understand it, choose a response, act, then reflect.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 19),
        type: 'choice',
        prompt: 'Which situation will you carry all the way through today?',
        options: options(morningId(9, 19), ['Something at home', 'Something at work or study', 'Something with a friend or family member', "Something I'm doing for myself"]),
      },
    },
    afternoon: {
      introduction: 'Work through your situation in order: understand it, choose a response, then carry it out.',
      activities: [
        {
          id: afternoonId(9, 19, 1),
          type: 'sequence',
          prompt: "Put today's steps in the order you'll use them.",
          instructions: 'Arrange these into the order that makes sense for working through your chosen situation.',
          items: [
            'Understand the situation more fully before reacting',
            'Choose one response that fits what you understood',
            'Carry out that response',
            'Reflect on how it went',
          ],
          correctOrder: [
            'Understand the situation more fully before reacting',
            'Choose one response that fits what you understood',
            'Carry out that response',
            'Reflect on how it went',
          ],
        },
        {
          id: afternoonId(9, 19, 2),
          type: 'realWorldAction',
          prompt: 'Carry out your response.',
          whatToDo: 'Using the order above, understand your chosen situation more fully, choose one response that fits, and carry it out today.',
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how it felt to move through all four steps deliberately instead of reacting automatically.',
      carryForwardThought: 'Use this same understand-choose-act-reflect sequence the next time something needs a considered response.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 20),
    number: 9,
    day: 20,
    title: 'Choose What Matters',
    theme: 'Select',
    morning: {
      focus: 'Begin narrowing down which practices from this cycle have mattered most to you.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 20),
        type: 'choice',
        prompt: 'Which kind of practice has mattered most to you this cycle?',
        options: options(morningId(9, 20), ['A perspective practice', 'A contribution practice', 'A completing or clearing practice', 'A reflection practice']),
      },
    },
    afternoon: {
      introduction: "Sort practices from this cycle into ones worth continuing and ones you're ready to let go of.",
      activities: [
        {
          id: afternoonId(9, 20),
          type: 'sort',
          prompt: 'Sort these practices from the cycle.',
          instructions: 'Sort each practice below into whether it feels worth continuing or whether you are ready to let it go.',
          items: [
            'Looking at the bigger picture',
            'Leaving something useful behind',
            'Pausing before concluding',
            'Making a small contribution',
            'Clearing clutter',
            'Completing tasks with care',
          ],
          categories: ['Worth continuing', 'Ready to let go of'],
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice which practices landed in "worth continuing" and why.',
      carryForwardThought: "Tomorrow's final review will ask you to choose just one or two - let today's sorting guide that choice.",
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
  {
    id: dayId(9, 21),
    number: 9,
    day: 21,
    title: 'Cycle Review',
    theme: 'Completion',
    morning: {
      focus: 'Take a few minutes to look back over the full 21 days before you begin.',
      colorCue: GOLD_CUE,
      activity: {
        id: morningId(9, 21),
        type: 'reflection',
        prompt: 'Review your 21 days.',
        reflectionPrompt: 'Looking back over all 21 days, what changed in how you see situations, or in what you noticed about contribution and completion?',
      },
    },
    afternoon: {
      introduction: 'Choose one or two practices from the full cycle to keep going.',
      activities: [
        {
          id: afternoonId(9, 21),
          type: 'multiChoice',
          prompt: 'Pick 1-2 practices from this cycle to carry forward.',
          options: options(afternoonId(9, 21), [
            'Looking at the bigger picture',
            'Leaving something useful behind',
            'Pausing before concluding',
            'Making a small contribution',
            'Clearing clutter regularly',
            'Completing tasks with care',
            'Revisiting familiar situations with fresh eyes',
          ]),
        },
      ],
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
    },
    night: {
      reflection: 'Notice how this final review feels compared to how Day 1 felt.',
      activity: {
        id: nightId(9, 21),
        type: 'rating',
        prompt: 'Rate the 21-day practice overall.',
        scaleLabel: 'Not very useful to very useful',
        min: 1,
        max: 5,
      },
      carryForwardThought: 'Keep the practice or practices you chose going, even now that the structured 21 days are complete.',
      experienceFeedbackPrompt: EXPERIENCE_FEEDBACK_PROMPT,
      repeatPreferencePrompt: REPEAT_PREFERENCE_PROMPT,
      affirmation: NUMBER_AFFIRMATIONS[9],
      closingThought: NUMBER_CLOSING_THOUGHTS[9],
    },
  },
];

// ---------------------------------------------------------------------------
// Assembled library
// ---------------------------------------------------------------------------

export const PRACTICE_LIBRARY: PracticeLibrary = {
  numbers: {
    1: { number: 1, theme: 'Initiative / Independence', keyword: 'Initiation', days: NUMBER_1_DAYS },
    2: { number: 2, theme: 'Connection / Perspective', keyword: 'Connection', days: NUMBER_2_DAYS },
    3: { number: 3, theme: 'Creativity / Expression', keyword: 'Expression', days: NUMBER_3_DAYS },
    4: { number: 4, theme: 'Structure / Order', keyword: 'Structure', days: NUMBER_4_DAYS },
    5: { number: 5, theme: 'Exploration / Adaptability', keyword: 'Adaptability', days: NUMBER_5_DAYS },
    6: { number: 6, theme: 'Appreciation / Care', keyword: 'Care', days: NUMBER_6_DAYS },
    7: { number: 7, theme: 'Observation / Curiosity / Discovery', keyword: 'Discovery', days: NUMBER_7_DAYS },
    8: { number: 8, theme: 'Practical Thinking / Planning / Decision', keyword: 'Strategy', days: NUMBER_8_DAYS },
    9: { number: 9, theme: 'Perspective / Understanding / Completion / Contribution', keyword: 'Completion', days: NUMBER_9_DAYS },
  },
};
