/**
 * Daily Activations: the new cognitive-task content model.
 *
 * Deliberately separate from `src/data/practiceLibrary.ts`'s `PracticeActivity`
 * model - not an extension of it. Two of the five categories below
 * ("observation", "memory") share a name with existing `ActivityType`
 * literals that mean something structurally different there (a free
 * tap-to-engage prompt, and a show/hide pairs display, neither with options
 * or a correct answer) - reusing those types here would silently collide.
 * `CognitiveTask` instead models exactly the new interaction: a
 * multiple-choice prompt with exactly one correct option, selected
 * independently of any PracticeActivity/PracticeDay content. The optional
 * `studyContent` field exists only for Memory tasks (the material studied
 * before the recall question in `prompt`) - every other category leaves
 * it unset.
 *
 * Selection is driven purely by day position (see `tasksForDay` below) -
 * never by the Focus Number, missing numbers, Lo Shu counts, or
 * `completedCycleNumbers`. This file contains no completion state, no user
 * state, and no store/engine imports - pure content, exactly like
 * `practiceLibrary.ts`.
 *
 * STUB CONTENT NOTICE: the question bank below is a small, deliberately
 * illustrative placeholder (a few entries per category) to validate the
 * data model and selector - not the final 105-task (21 x 5) content. Real
 * content is a later step.
 */

export type CognitiveTaskCategory = 'logic' | 'spatial' | 'memory' | 'language' | 'observation';

export interface CognitiveTaskOption {
  id: string;
  label: string;
}

export interface CognitiveTask {
  id: string;
  category: CognitiveTaskCategory;
  /** 1-based position within this category's 21-day list. */
  day: number;
  /** The material to study, shown before the recall question - only
   *  Memory tasks need this; Logic/Spatial/Language/Observation tasks
   *  leave it unset. Deliberately optional and separate from `prompt`
   *  (the question asked afterward), so the study phase and the recall
   *  question are never conflated into one string. */
  studyContent?: string;
  prompt: string;
  options: CognitiveTaskOption[];
  correctOptionId: string;
}

function option(id: string, label: string): CognitiveTaskOption {
  return { id, label };
}

// ---------------------------------------------------------------------------
// LOGIC - the first production (non-stub) category: all 21 days, following
// the approved blueprint. Every task is solvable entirely from its own
// prompt, has exactly one objectively correct answer, and avoids specialist/
// cultural/current-events knowledge. Spatial/Memory/Language/Observation
// remain small placeholder stubs below, unchanged by this step.
// ---------------------------------------------------------------------------

export const LOGIC_TASKS: CognitiveTask[] = [
  {
    id: 'logic-d1',
    category: 'logic',
    day: 1,
    prompt: 'What number comes next in this pattern: 2, 4, 6, 8, ?',
    options: [option('logic-d1-1', '10'), option('logic-d1-2', '9'), option('logic-d1-3', '11'), option('logic-d1-4', '12')],
    correctOptionId: 'logic-d1-1',
  },
  {
    id: 'logic-d2',
    category: 'logic',
    day: 2,
    prompt: 'Which letter comes next in this pattern: A, C, E, G, ?',
    options: [option('logic-d2-1', 'H'), option('logic-d2-2', 'I'), option('logic-d2-3', 'J'), option('logic-d2-4', 'K')],
    correctOptionId: 'logic-d2-2',
  },
  {
    id: 'logic-d3',
    category: 'logic',
    day: 3,
    prompt:
      'The red box is heavier than the blue box. The blue box is heavier than the green box. Put the boxes in order from lightest to heaviest.',
    options: [
      option('logic-d3-1', 'Blue, Green, Red'),
      option('logic-d3-2', 'Red, Blue, Green'),
      option('logic-d3-3', 'Green, Blue, Red'),
      option('logic-d3-4', 'Green, Red, Blue'),
    ],
    correctOptionId: 'logic-d3-3',
  },
  {
    id: 'logic-d4',
    category: 'logic',
    day: 4,
    prompt: 'What number comes next in this pattern: 1, 2, 4, 5, 7, 8, ?',
    options: [option('logic-d4-1', '9'), option('logic-d4-2', '11'), option('logic-d4-3', '12'), option('logic-d4-4', '10')],
    correctOptionId: 'logic-d4-4',
  },
  {
    id: 'logic-d5',
    category: 'logic',
    day: 5,
    prompt: 'All cats in the shelter are female. Whiskers is a cat in the shelter. Which of these must be true?',
    options: [
      option('logic-d5-1', 'Whiskers is female.'),
      option('logic-d5-2', 'Whiskers is male.'),
      option('logic-d5-3', 'Whiskers is not in the shelter.'),
      option('logic-d5-4', 'All female animals are cats.'),
    ],
    correctOptionId: 'logic-d5-1',
  },
  {
    id: 'logic-d6',
    category: 'logic',
    day: 6,
    prompt: 'Sam and Lee each have a different pet: a dog or a cat. Sam does not have a dog. Which pet does Lee have?',
    options: [
      option('logic-d6-1', 'A cat.'),
      option('logic-d6-2', 'A dog.'),
      option('logic-d6-3', 'Both a dog and a cat.'),
      option('logic-d6-4', 'Neither a dog nor a cat.'),
    ],
    correctOptionId: 'logic-d6-2',
  },
  {
    id: 'logic-d7',
    category: 'logic',
    day: 7,
    prompt: 'If the switch is up, the light is on. The switch is up. Which of these must be true?',
    options: [
      option('logic-d7-1', 'The light is off.'),
      option('logic-d7-2', 'The switch is down.'),
      option('logic-d7-3', 'The light is on.'),
      option('logic-d7-4', 'The switch is broken.'),
    ],
    correctOptionId: 'logic-d7-3',
  },
  {
    id: 'logic-d8',
    category: 'logic',
    day: 8,
    prompt: 'What number comes next in this pattern: 3, 7, 15, 31, ?',
    options: [option('logic-d8-1', '61'), option('logic-d8-2', '62'), option('logic-d8-3', '64'), option('logic-d8-4', '63')],
    correctOptionId: 'logic-d8-4',
  },
  {
    id: 'logic-d9',
    category: 'logic',
    day: 9,
    prompt: 'Which letter comes next in this pattern: A, B, C, C, B, ?',
    options: [option('logic-d9-1', 'A'), option('logic-d9-2', 'B'), option('logic-d9-3', 'C'), option('logic-d9-4', 'D')],
    correctOptionId: 'logic-d9-1',
  },
  {
    id: 'logic-d10',
    category: 'logic',
    day: 10,
    prompt:
      'Ana, Ben, and Cleo each ordered a different drink: tea, coffee, or juice. Ana did not order coffee or tea. Ben did not order tea. What did Cleo order?',
    options: [
      option('logic-d10-1', 'Coffee.'),
      option('logic-d10-2', 'Tea.'),
      option('logic-d10-3', 'Juice.'),
      option('logic-d10-4', 'Water.'),
    ],
    correctOptionId: 'logic-d10-2',
  },
  {
    id: 'logic-d11',
    category: 'logic',
    day: 11,
    prompt:
      'Four hikers are on a trail: Jun, Kira, Leo, and Mo. Jun finished before Kira. Kira finished before Leo. Which of these must be true?',
    options: [
      option('logic-d11-1', 'Leo finished before Jun.'),
      option('logic-d11-2', 'Mo finished before Jun.'),
      option('logic-d11-3', 'Jun finished before Leo.'),
      option('logic-d11-4', 'Kira finished last.'),
    ],
    correctOptionId: 'logic-d11-3',
  },
  {
    id: 'logic-d12',
    category: 'logic',
    day: 12,
    prompt:
      'All members of the chess club like puzzles. Everyone who likes puzzles enjoys quiet afternoons. Dana is a member of the chess club. Which of these must be true?',
    options: [
      option('logic-d12-1', 'Dana dislikes puzzles.'),
      option('logic-d12-2', 'Dana is not a member of any club.'),
      option('logic-d12-3', 'Everyone who enjoys quiet afternoons is in the chess club.'),
      option('logic-d12-4', 'Dana enjoys quiet afternoons.'),
    ],
    correctOptionId: 'logic-d12-4',
  },
  {
    id: 'logic-d13',
    category: 'logic',
    day: 13,
    prompt:
      'If Mara waters the plant, it will grow. If the plant grows, it will need a bigger pot. Mara waters the plant. What will the plant eventually need?',
    options: [
      option('logic-d13-1', 'A bigger pot.'),
      option('logic-d13-2', 'Less water.'),
      option('logic-d13-3', 'More sunlight.'),
      option('logic-d13-4', 'To be replanted outside.'),
    ],
    correctOptionId: 'logic-d13-1',
  },
  {
    id: 'logic-d14',
    category: 'logic',
    day: 14,
    prompt: 'What comes next in this pattern: A1, B2, C3, D4, ?',
    options: [option('logic-d14-1', 'D5'), option('logic-d14-2', 'E5'), option('logic-d14-3', 'E4'), option('logic-d14-4', 'F5')],
    correctOptionId: 'logic-d14-2',
  },
  {
    id: 'logic-d15',
    category: 'logic',
    day: 15,
    prompt: 'Which number breaks the pattern in this list: 5, 10, 15, 21, 25?',
    options: [option('logic-d15-1', '10'), option('logic-d15-2', '15'), option('logic-d15-3', '21'), option('logic-d15-4', '25')],
    correctOptionId: 'logic-d15-3',
  },
  {
    id: 'logic-d16',
    category: 'logic',
    day: 16,
    prompt:
      'Three friends sit in a row at the cinema: Kira, Leo, and Mona. Kira is not sitting on either end. Leo is sitting to the left of Kira. Who is sitting on the right end?',
    options: [
      option('logic-d16-1', 'Kira'),
      option('logic-d16-2', 'Leo'),
      option('logic-d16-3', 'Either Kira or Mona.'),
      option('logic-d16-4', 'Mona'),
    ],
    correctOptionId: 'logic-d16-4',
  },
  {
    id: 'logic-d17',
    category: 'logic',
    day: 17,
    prompt: 'If the alarm rings, Tom wakes up. If Tom wakes up, he turns off the alarm. The alarm rings. What happens next?',
    options: [
      option('logic-d17-1', 'He turns off the alarm.'),
      option('logic-d17-2', 'He stays asleep.'),
      option('logic-d17-3', 'The alarm rings again.'),
      option('logic-d17-4', 'He sets a new alarm.'),
    ],
    correctOptionId: 'logic-d17-1',
  },
  {
    id: 'logic-d18',
    category: 'logic',
    day: 18,
    prompt: 'What number comes next in this pattern: 3, 6, 11, 18, 27, ?',
    options: [option('logic-d18-1', '36'), option('logic-d18-2', '38'), option('logic-d18-3', '37'), option('logic-d18-4', '40')],
    correctOptionId: 'logic-d18-2',
  },
  {
    id: 'logic-d19',
    category: 'logic',
    day: 19,
    prompt: 'Every ticket holder gets a free drink. Every person in line has a ticket. Which of these must be true?',
    options: [
      option('logic-d19-1', 'No one in line has a ticket.'),
      option('logic-d19-2', 'Free drinks are only for people not in line.'),
      option('logic-d19-3', 'Everyone in line gets a free drink.'),
      option('logic-d19-4', 'Some people in line do not have tickets.'),
    ],
    correctOptionId: 'logic-d19-3',
  },
  {
    id: 'logic-d20',
    category: 'logic',
    day: 20,
    prompt:
      'Four chores must be done in order: sweeping, dusting, mopping, and vacuuming. Mopping must happen after dusting. Vacuuming must happen before sweeping. Which order could be correct?',
    options: [
      option('logic-d20-1', 'Sweeping, Vacuuming, Dusting, Mopping'),
      option('logic-d20-2', 'Vacuuming, Mopping, Dusting, Sweeping'),
      option('logic-d20-3', 'Dusting, Mopping, Sweeping, Vacuuming'),
      option('logic-d20-4', 'Vacuuming, Dusting, Sweeping, Mopping'),
    ],
    correctOptionId: 'logic-d20-4',
  },
  {
    id: 'logic-d21',
    category: 'logic',
    day: 21,
    prompt:
      "Look at this pattern: 2, 4, 6, 8. If the next number in the pattern is even, double it. If it is odd, add 1 to it. What is the result?",
    options: [option('logic-d21-1', '20'), option('logic-d21-2', '18'), option('logic-d21-3', '19'), option('logic-d21-4', '22')],
    correctOptionId: 'logic-d21-1',
  },
];

// ---------------------------------------------------------------------------
// SPATIAL - the second production (non-stub) category: all 21 days,
// following the approved blueprint. No images, no drag-and-drop, no true
// mental rotation/folding - only text, words, numbers, and the four cardinal
// direction symbols (↑ → ↓ ←). Absolute directions throughout (North=up,
// East=right, South=down, West=left); every facing/turn/path is stated
// explicitly so there is only one interpretation. Memory/Language/
// Observation remain small placeholder stubs below, unchanged by this step.
// ---------------------------------------------------------------------------

export const SPATIAL_TASKS: CognitiveTask[] = [
  {
    id: 'spatial-d1',
    category: 'spatial',
    day: 1,
    prompt: 'You are facing North. You turn right. Which direction are you now facing?',
    options: [
      option('spatial-d1-1', 'East'),
      option('spatial-d1-2', 'North'),
      option('spatial-d1-3', 'South'),
      option('spatial-d1-4', 'West'),
    ],
    correctOptionId: 'spatial-d1-1',
  },
  {
    id: 'spatial-d2',
    category: 'spatial',
    day: 2,
    prompt: "A clock's hour hand points to 12. It rotates a quarter turn (90°) clockwise. Which number does it now point to?",
    options: [option('spatial-d2-1', '6'), option('spatial-d2-2', '3'), option('spatial-d2-3', '9'), option('spatial-d2-4', '12')],
    correctOptionId: 'spatial-d2-2',
  },
  {
    id: 'spatial-d3',
    category: 'spatial',
    day: 3,
    prompt: 'An arrow points to the right (→). If you flip it into its mirror image (left-right), which way does it now point?',
    options: [option('spatial-d3-1', '↑'), option('spatial-d3-2', '→'), option('spatial-d3-3', '←'), option('spatial-d3-4', '↓')],
    correctOptionId: 'spatial-d3-3',
  },
  {
    id: 'spatial-d4',
    category: 'spatial',
    day: 4,
    prompt: 'You are facing North. You turn right, then turn right again. Which direction are you now facing?',
    options: [
      option('spatial-d4-1', 'North'),
      option('spatial-d4-2', 'East'),
      option('spatial-d4-3', 'West'),
      option('spatial-d4-4', 'South'),
    ],
    correctOptionId: 'spatial-d4-4',
  },
  {
    id: 'spatial-d5',
    category: 'spatial',
    day: 5,
    prompt: 'A book is above a cup. The cup is above a plate. Which item is in the middle?',
    options: [
      option('spatial-d5-1', 'Cup'),
      option('spatial-d5-2', 'Book'),
      option('spatial-d5-3', 'Plate'),
      option('spatial-d5-4', 'Table'),
    ],
    correctOptionId: 'spatial-d5-1',
  },
  {
    id: 'spatial-d6',
    category: 'spatial',
    day: 6,
    prompt: 'You walk North, then you walk East. Which direction was your final movement?',
    options: [
      option('spatial-d6-1', 'North'),
      option('spatial-d6-2', 'East'),
      option('spatial-d6-3', 'South'),
      option('spatial-d6-4', 'West'),
    ],
    correctOptionId: 'spatial-d6-2',
  },
  {
    id: 'spatial-d7',
    category: 'spatial',
    day: 7,
    prompt: 'If ↑ means North, → means East, ↓ means South, and ← means West, which arrow matches South?',
    options: [option('spatial-d7-1', '↑'), option('spatial-d7-2', '→'), option('spatial-d7-3', '↓'), option('spatial-d7-4', '←')],
    correctOptionId: 'spatial-d7-3',
  },
  {
    id: 'spatial-d8',
    category: 'spatial',
    day: 8,
    prompt: 'You start facing North. You turn right. You turn right again. You turn right a third time. Which direction are you now facing?',
    options: [
      option('spatial-d8-1', 'North'),
      option('spatial-d8-2', 'East'),
      option('spatial-d8-3', 'South'),
      option('spatial-d8-4', 'West'),
    ],
    correctOptionId: 'spatial-d8-4',
  },
  {
    id: 'spatial-d9',
    category: 'spatial',
    day: 9,
    prompt:
      'Four books are in a row: red, blue, green, and yellow, in some left-to-right order. The blue book is immediately to the right of the red book. Which of these must be true?',
    options: [
      option('spatial-d9-1', 'The red book is to the left of the blue book.'),
      option('spatial-d9-2', 'The red book is to the right of the blue book.'),
      option('spatial-d9-3', 'The blue book is at the left end.'),
      option('spatial-d9-4', 'The red book is at the right end.'),
    ],
    correctOptionId: 'spatial-d9-1',
  },
  {
    id: 'spatial-d10',
    category: 'spatial',
    day: 10,
    prompt: 'Look at this sequence: ↑, →, ↓, ←, ↑, →, ?. Which symbol comes next?',
    options: [option('spatial-d10-1', '↑'), option('spatial-d10-2', '↓'), option('spatial-d10-3', '←'), option('spatial-d10-4', '→')],
    correctOptionId: 'spatial-d10-2',
  },
  {
    id: 'spatial-d11',
    category: 'spatial',
    day: 11,
    prompt: 'You are facing North. You turn around completely (180°), the opposite way from where you started. Which direction are you now facing?',
    options: [
      option('spatial-d11-1', 'North'),
      option('spatial-d11-2', 'East'),
      option('spatial-d11-3', 'South'),
      option('spatial-d11-4', 'West'),
    ],
    correctOptionId: 'spatial-d11-3',
  },
  {
    id: 'spatial-d12',
    category: 'spatial',
    day: 12,
    prompt:
      'Four chairs are in a row, positions 1 to 4 from left to right: red, blue, green, and yellow, in some order. The red chair is immediately to the left of the blue chair. The green chair is in position 1. Which of these must be true?',
    options: [
      option('spatial-d12-1', 'The red chair is in position 2.'),
      option('spatial-d12-2', 'The yellow chair is in position 4.'),
      option('spatial-d12-3', 'The blue chair is to the left of the green chair.'),
      option('spatial-d12-4', 'The green chair is to the left of the red chair.'),
    ],
    correctOptionId: 'spatial-d12-4',
  },
  {
    id: 'spatial-d13',
    category: 'spatial',
    day: 13,
    prompt: 'Look at this sequence: ↑, ↑, →, →, ↓, ↓, ?. Which symbol comes next?',
    options: [option('spatial-d13-1', '←'), option('spatial-d13-2', '↑'), option('spatial-d13-3', '→'), option('spatial-d13-4', '↓')],
    correctOptionId: 'spatial-d13-1',
  },
  {
    id: 'spatial-d14',
    category: 'spatial',
    day: 14,
    prompt: 'You are facing North. You turn clockwise until you are facing South. How many quarter turns (90° each) did that take?',
    options: [option('spatial-d14-1', '1'), option('spatial-d14-2', '2'), option('spatial-d14-3', '3'), option('spatial-d14-4', '4')],
    correctOptionId: 'spatial-d14-2',
  },
  {
    id: 'spatial-d15',
    category: 'spatial',
    day: 15,
    prompt:
      "Maya is facing North. Liam is facing South, directly opposite Maya. Maya turns right twice, so she now faces South. Compared to Maya's new direction, is Liam now facing the same direction, the opposite direction, 90° to Maya's left, or 90° to Maya's right?",
    options: [
      option('spatial-d15-1', 'The opposite direction.'),
      option('spatial-d15-2', "A direction 90° to Maya's left."),
      option('spatial-d15-3', 'The same direction.'),
      option('spatial-d15-4', "A direction 90° to Maya's right."),
    ],
    correctOptionId: 'spatial-d15-3',
  },
  {
    id: 'spatial-d16',
    category: 'spatial',
    day: 16,
    prompt: 'Look at this sequence: →, ↓, ←, ↑, →, ?. Which symbol comes next?',
    options: [option('spatial-d16-1', '→'), option('spatial-d16-2', '←'), option('spatial-d16-3', '↑'), option('spatial-d16-4', '↓')],
    correctOptionId: 'spatial-d16-4',
  },
  {
    id: 'spatial-d17',
    category: 'spatial',
    day: 17,
    prompt:
      'You start at the Library, facing North. You walk to the Cafe. You turn right and walk to the Park. You turn right again and walk to the School. Which direction are you now facing?',
    options: [
      option('spatial-d17-1', 'South'),
      option('spatial-d17-2', 'North'),
      option('spatial-d17-3', 'East'),
      option('spatial-d17-4', 'West'),
    ],
    correctOptionId: 'spatial-d17-1',
  },
  {
    id: 'spatial-d18',
    category: 'spatial',
    day: 18,
    prompt:
      'Three signs are in a row: Stop, Yield, and Speed Limit. The Yield sign is between the Stop sign and the Speed Limit sign. The Stop sign is to the left of the Yield sign. What is the order from left to right?',
    options: [
      option('spatial-d18-1', 'Speed Limit, Yield, Stop'),
      option('spatial-d18-2', 'Stop, Yield, Speed Limit'),
      option('spatial-d18-3', 'Yield, Stop, Speed Limit'),
      option('spatial-d18-4', 'Stop, Speed Limit, Yield'),
    ],
    correctOptionId: 'spatial-d18-2',
  },
  {
    id: 'spatial-d19',
    category: 'spatial',
    day: 19,
    prompt: 'Look at this sequence: ↑, →, →, ↓, ↓, ↓, ←, ←, ←, ←, ?. Which symbol comes next?',
    options: [option('spatial-d19-1', '←'), option('spatial-d19-2', '↓'), option('spatial-d19-3', '↑'), option('spatial-d19-4', '→')],
    correctOptionId: 'spatial-d19-3',
  },
  {
    id: 'spatial-d20',
    category: 'spatial',
    day: 20,
    prompt:
      'Priya is facing East. Omar is facing West. Priya turns right, then turns right again. Compared to Omar\'s direction, is Priya now facing the same direction, the opposite direction, 90° clockwise from it, or 90° counter-clockwise from it?',
    options: [
      option('spatial-d20-1', 'The same direction as Omar.'),
      option('spatial-d20-2', 'The opposite direction from Omar.'),
      option('spatial-d20-3', "90° counter-clockwise from Omar's direction."),
      option('spatial-d20-4', "90° clockwise from Omar's direction."),
    ],
    correctOptionId: 'spatial-d20-1',
  },
  {
    id: 'spatial-d21',
    category: 'spatial',
    day: 21,
    prompt: 'You are facing North. You turn right, then turn left, then turn right again. Which direction are you now facing?',
    options: [
      option('spatial-d21-1', 'East'),
      option('spatial-d21-2', 'North'),
      option('spatial-d21-3', 'South'),
      option('spatial-d21-4', 'West'),
    ],
    correctOptionId: 'spatial-d21-1',
  },
];

// ---------------------------------------------------------------------------
// MEMORY - the third production (non-stub) category: all 21 days, following
// the approved blueprint. Every task uses the Study -> Continue -> Recall
// model via `studyContent` (the material to remember) kept distinct from
// `prompt` (the recall question asked afterward). No timers, no scoring, no
// phonetic/spelling tricks. Language/Observation remain small placeholder
// stubs below, unchanged by this step.
// ---------------------------------------------------------------------------

export const MEMORY_TASKS: CognitiveTask[] = [
  {
    id: 'memory-d1',
    category: 'memory',
    day: 1,
    studyContent: 'Lantern, River, Pencil',
    prompt: 'Which of these words was shown earlier?',
    options: [
      option('memory-d1-1', 'Lantern'),
      option('memory-d1-2', 'Mountain'),
      option('memory-d1-3', 'Candle'),
      option('memory-d1-4', 'Window'),
    ],
    correctOptionId: 'memory-d1-1',
  },
  {
    id: 'memory-d2',
    category: 'memory',
    day: 2,
    studyContent: '7, 3, 9',
    prompt: 'What was the second number shown?',
    options: [option('memory-d2-1', '7'), option('memory-d2-2', '3'), option('memory-d2-3', '9'), option('memory-d2-4', '5')],
    correctOptionId: 'memory-d2-2',
  },
  {
    id: 'memory-d3',
    category: 'memory',
    day: 3,
    studyContent: 'Red, Blue, Green',
    prompt: 'Which of these colors was NOT shown?',
    options: [
      option('memory-d3-1', 'Red'),
      option('memory-d3-2', 'Green'),
      option('memory-d3-3', 'Yellow'),
      option('memory-d3-4', 'Blue'),
    ],
    correctOptionId: 'memory-d3-3',
  },
  {
    id: 'memory-d4',
    category: 'memory',
    day: 4,
    studyContent: '1. Hat  2. Key  3. Spoon  4. Clock',
    prompt: 'What position was the Spoon in?',
    options: [option('memory-d4-1', '1'), option('memory-d4-2', '2'), option('memory-d4-3', '4'), option('memory-d4-4', '3')],
    correctOptionId: 'memory-d4-4',
  },
  {
    id: 'memory-d5',
    category: 'memory',
    day: 5,
    studyContent: '🔑 🎈 🍎 ⭐',
    prompt: 'Which of these symbols was shown earlier?',
    options: [option('memory-d5-1', '🔑'), option('memory-d5-2', '🚗'), option('memory-d5-3', '🌙'), option('memory-d5-4', '📱')],
    correctOptionId: 'memory-d5-1',
  },
  {
    id: 'memory-d6',
    category: 'memory',
    day: 6,
    studyContent: '1. Orange  2. Table  3. Cloud  4. Brush',
    prompt: 'Which word was shown third?',
    options: [
      option('memory-d6-1', 'Orange'),
      option('memory-d6-2', 'Cloud'),
      option('memory-d6-3', 'Table'),
      option('memory-d6-4', 'Brush'),
    ],
    correctOptionId: 'memory-d6-2',
  },
  {
    id: 'memory-d7',
    category: 'memory',
    day: 7,
    studyContent: 'Wake up → Brush teeth → Eat breakfast → Leave home',
    prompt: "What happened immediately after 'Brush teeth'?",
    options: [
      option('memory-d7-1', 'Wake up'),
      option('memory-d7-2', 'Leave home'),
      option('memory-d7-3', 'Eat breakfast'),
      option('memory-d7-4', 'Take a shower'),
    ],
    correctOptionId: 'memory-d7-3',
  },
  {
    id: 'memory-d8',
    category: 'memory',
    day: 8,
    studyContent: '1. Kite  2. Lamp  3. Boots  4. Ribbon  5. Anchor',
    prompt: 'Which word was shown fourth?',
    options: [
      option('memory-d8-1', 'Kite'),
      option('memory-d8-2', 'Lamp'),
      option('memory-d8-3', 'Anchor'),
      option('memory-d8-4', 'Ribbon'),
    ],
    correctOptionId: 'memory-d8-4',
  },
  {
    id: 'memory-d9',
    category: 'memory',
    day: 9,
    studyContent: 'Apple - Fruit, Carrot - Vegetable, Banana - Fruit, Potato - Vegetable, Grape - Fruit',
    prompt: "What category was 'Carrot' in?",
    options: [
      option('memory-d9-1', 'Vegetable'),
      option('memory-d9-2', 'Fruit'),
      option('memory-d9-3', 'Grain'),
      option('memory-d9-4', 'Dairy'),
    ],
    correctOptionId: 'memory-d9-1',
  },
  {
    id: 'memory-d10',
    category: 'memory',
    day: 10,
    studyContent: 'Step 1: Mix flour. Step 2: Add water. Step 3: Stir well. Step 4: Pour batter. Step 5: Bake.',
    prompt: 'What was Step 3?',
    options: [
      option('memory-d10-1', 'Mix flour'),
      option('memory-d10-2', 'Stir well'),
      option('memory-d10-3', 'Add water'),
      option('memory-d10-4', 'Pour batter'),
    ],
    correctOptionId: 'memory-d10-2',
  },
  {
    id: 'memory-d11',
    category: 'memory',
    day: 11,
    studyContent: 'Position 1: ⭐  Position 2: 🔑  Position 3: 🍎  Position 4: 🎈  Position 5: 🚗',
    prompt: 'What position was 🍎 in?',
    options: [option('memory-d11-1', '2'), option('memory-d11-2', '4'), option('memory-d11-3', '3'), option('memory-d11-4', '5')],
    correctOptionId: 'memory-d11-3',
  },
  {
    id: 'memory-d12',
    category: 'memory',
    day: 12,
    studyContent: 'Order shown: Pen, Cup, Book, Lamp, Shoe, Hat',
    prompt: 'Which of these came first: Book or Shoe?',
    options: [
      option('memory-d12-1', 'Shoe'),
      option('memory-d12-2', 'They appeared at the same time.'),
      option('memory-d12-3', 'Neither was shown.'),
      option('memory-d12-4', 'Book'),
    ],
    correctOptionId: 'memory-d12-4',
  },
  {
    id: 'memory-d13',
    category: 'memory',
    day: 13,
    studyContent: 'Hammer, Candle, Pillow, Mirror, Basket, Ladder',
    prompt: 'Which of these was NOT shown earlier?',
    options: [
      option('memory-d13-1', 'Scissors'),
      option('memory-d13-2', 'Mirror'),
      option('memory-d13-3', 'Basket'),
      option('memory-d13-4', 'Ladder'),
    ],
    correctOptionId: 'memory-d13-1',
  },
  {
    id: 'memory-d14',
    category: 'memory',
    day: 14,
    studyContent: '1. Sun  2. Moon  3. Star  4. Cloud  5. Rain  6. Wind',
    prompt: 'What was in position 5?',
    options: [option('memory-d14-1', 'Star'), option('memory-d14-2', 'Rain'), option('memory-d14-3', 'Cloud'), option('memory-d14-4', 'Wind')],
    correctOptionId: 'memory-d14-2',
  },
  {
    id: 'memory-d15',
    category: 'memory',
    day: 15,
    studyContent: 'Apple-4, River-9, Cloud-2, Table-7, Spoon-5',
    prompt: "What number was paired with 'Cloud'?",
    options: [option('memory-d15-1', '4'), option('memory-d15-2', '9'), option('memory-d15-3', '2'), option('memory-d15-4', '7')],
    correctOptionId: 'memory-d15-3',
  },
  {
    id: 'memory-d16',
    category: 'memory',
    day: 16,
    studyContent: 'Morning routine, in order: Wake up, Stretch, Brush teeth, Get dressed, Eat breakfast',
    prompt: "Which happened first: 'Get dressed' or 'Stretch'?",
    options: [
      option('memory-d16-1', 'Get dressed'),
      option('memory-d16-2', 'They happened at the same time.'),
      option('memory-d16-3', 'Neither was part of the routine.'),
      option('memory-d16-4', 'Stretch'),
    ],
    correctOptionId: 'memory-d16-4',
  },
  {
    id: 'memory-d17',
    category: 'memory',
    day: 17,
    studyContent: 'Apple - Red, Banana - Yellow, Cherry - Red, Lemon - Yellow, Grape - Purple, Plum - Purple',
    prompt: "What color was paired with 'Cherry'?",
    options: [
      option('memory-d17-1', 'Red'),
      option('memory-d17-2', 'Yellow'),
      option('memory-d17-3', 'Purple'),
      option('memory-d17-4', 'Green'),
    ],
    correctOptionId: 'memory-d17-1',
  },
  {
    id: 'memory-d18',
    category: 'memory',
    day: 18,
    studyContent: 'Position 1: 🔑  Position 2: ⭐  Position 3: 🚗  Position 4: 🎈  Position 5: 🍎  Position 6: 📌',
    prompt: 'What position was 🎈 in?',
    options: [option('memory-d18-1', '3'), option('memory-d18-2', '4'), option('memory-d18-3', '5'), option('memory-d18-4', '6')],
    correctOptionId: 'memory-d18-2',
  },
  {
    id: 'memory-d19',
    category: 'memory',
    day: 19,
    studyContent: 'Blanket, Teapot, Candle, Armchair',
    prompt: 'Which of these items was shown earlier?',
    options: [
      option('memory-d19-1', 'Umbrella'),
      option('memory-d19-2', 'Bicycle'),
      option('memory-d19-3', 'Teapot'),
      option('memory-d19-4', 'Calendar'),
    ],
    correctOptionId: 'memory-d19-3',
  },
  {
    id: 'memory-d20',
    category: 'memory',
    day: 20,
    studyContent: 'Apple-3, River-8, Cloud-1, Table-6, Spoon-4, Window-7, Candle-2',
    prompt: "What number was paired with 'Table'?",
    options: [option('memory-d20-1', '3'), option('memory-d20-2', '8'), option('memory-d20-3', '4'), option('memory-d20-4', '6')],
    correctOptionId: 'memory-d20-4',
  },
  {
    id: 'memory-d21',
    category: 'memory',
    day: 21,
    studyContent: 'Feather, Seashell, Lantern, Acorn, Ribbon',
    prompt: 'Which of these items was shown earlier?',
    options: [
      option('memory-d21-1', 'Lantern'),
      option('memory-d21-2', 'Hammer'),
      option('memory-d21-3', 'Engine'),
      option('memory-d21-4', 'Ladder'),
    ],
    correctOptionId: 'memory-d21-1',
  },
];

// ---------------------------------------------------------------------------
// LANGUAGE - the fourth production (non-stub) category: all 21 days,
// following the approved blueprint. Every task is solvable entirely from its
// own prompt, has exactly one objectively correct answer, and avoids
// specialist/cultural/current-events knowledge and subtle synonym
// distinctions. Observation remains a small placeholder stub below,
// unchanged by this step.
// ---------------------------------------------------------------------------

export const LANGUAGE_TASKS: CognitiveTask[] = [
  {
    id: 'language-d1',
    category: 'language',
    day: 1,
    prompt: "Which word means the same as 'begin'?",
    options: [
      option('language-d1-1', 'Start'),
      option('language-d1-2', 'End'),
      option('language-d1-3', 'Stop'),
      option('language-d1-4', 'Wait'),
    ],
    correctOptionId: 'language-d1-1',
  },
  {
    id: 'language-d2',
    category: 'language',
    day: 2,
    prompt: "Which word is the opposite of 'empty'?",
    options: [
      option('language-d2-1', 'Hollow'),
      option('language-d2-2', 'Full'),
      option('language-d2-3', 'Light'),
      option('language-d2-4', 'Open'),
    ],
    correctOptionId: 'language-d2-2',
  },
  {
    id: 'language-d3',
    category: 'language',
    day: 3,
    prompt: 'Which of these does not belong: Apple, Banana, Carrot, Orange?',
    options: [
      option('language-d3-1', 'Apple'),
      option('language-d3-2', 'Banana'),
      option('language-d3-3', 'Carrot'),
      option('language-d3-4', 'Orange'),
    ],
    correctOptionId: 'language-d3-3',
  },
  {
    id: 'language-d4',
    category: 'language',
    day: 4,
    prompt: 'After the long hike, he was exhausted and wanted to ___.',
    options: [
      option('language-d4-1', 'paint'),
      option('language-d4-2', 'shout'),
      option('language-d4-3', 'cook'),
      option('language-d4-4', 'rest'),
    ],
    correctOptionId: 'language-d4-4',
  },
  {
    id: 'language-d5',
    category: 'language',
    day: 5,
    prompt: 'Bird is to nest as bee is to ___?',
    options: [
      option('language-d5-1', 'Hive'),
      option('language-d5-2', 'Web'),
      option('language-d5-3', 'Nest'),
      option('language-d5-4', 'Burrow'),
    ],
    correctOptionId: 'language-d5-1',
  },
  {
    id: 'language-d6',
    category: 'language',
    day: 6,
    prompt: 'Which sentence is in the correct order?',
    options: [
      option('language-d6-1', 'Quickly the across ran dog park.'),
      option('language-d6-2', 'The dog ran quickly across the park.'),
      option('language-d6-3', 'Dog the ran park quickly across the.'),
      option('language-d6-4', 'Park the across ran quickly dog the.'),
    ],
    correctOptionId: 'language-d6-2',
  },
  {
    id: 'language-d7',
    category: 'language',
    day: 7,
    prompt: 'What comes next in the pattern: A, C, E, G, ?',
    options: [
      option('language-d7-1', 'H'),
      option('language-d7-2', 'J'),
      option('language-d7-3', 'I'),
      option('language-d7-4', 'K'),
    ],
    correctOptionId: 'language-d7-3',
  },
  {
    id: 'language-d8',
    category: 'language',
    day: 8,
    prompt: "Which word means the same as 'quiet'?",
    options: [
      option('language-d8-1', 'Loud'),
      option('language-d8-2', 'Busy'),
      option('language-d8-3', 'Bright'),
      option('language-d8-4', 'Silent'),
    ],
    correctOptionId: 'language-d8-4',
  },
  {
    id: 'language-d9',
    category: 'language',
    day: 9,
    prompt: 'Finger is to hand as petal is to ___?',
    options: [
      option('language-d9-1', 'Flower'),
      option('language-d9-2', 'Leaf'),
      option('language-d9-3', 'Root'),
      option('language-d9-4', 'Stem'),
    ],
    correctOptionId: 'language-d9-1',
  },
  {
    id: 'language-d10',
    category: 'language',
    day: 10,
    prompt: 'Because it started to rain, she opened her ___.',
    options: [
      option('language-d10-1', 'Book'),
      option('language-d10-2', 'Umbrella'),
      option('language-d10-3', 'Window'),
      option('language-d10-4', 'Oven'),
    ],
    correctOptionId: 'language-d10-2',
  },
  {
    id: 'language-d11',
    category: 'language',
    day: 11,
    prompt: 'Which sentence is in the correct order?',
    options: [
      option('language-d11-1', 'Morning every she coffee drinks her in the.'),
      option('language-d11-2', 'Coffee her she every drinks morning in the.'),
      option('language-d11-3', 'She drinks her coffee every morning.'),
      option('language-d11-4', 'Every morning coffee drinks she her.'),
    ],
    correctOptionId: 'language-d11-3',
  },
  {
    id: 'language-d12',
    category: 'language',
    day: 12,
    prompt: "Which word is the opposite of 'early'?",
    options: [
      option('language-d12-1', 'Soon'),
      option('language-d12-2', 'Fast'),
      option('language-d12-3', 'Near'),
      option('language-d12-4', 'Late'),
    ],
    correctOptionId: 'language-d12-4',
  },
  {
    id: 'language-d13',
    category: 'language',
    day: 13,
    prompt: 'Which of these does not belong: Spoon, Knife, Scissors, Blade?',
    options: [
      option('language-d13-1', 'Spoon'),
      option('language-d13-2', 'Knife'),
      option('language-d13-3', 'Scissors'),
      option('language-d13-4', 'Razor'),
    ],
    correctOptionId: 'language-d13-1',
  },
  {
    id: 'language-d14',
    category: 'language',
    day: 14,
    prompt: 'What comes next in the pattern: A, D, G, J, ?',
    options: [
      option('language-d14-1', 'K'),
      option('language-d14-2', 'M'),
      option('language-d14-3', 'L'),
      option('language-d14-4', 'N'),
    ],
    correctOptionId: 'language-d14-2',
  },
  {
    id: 'language-d15',
    category: 'language',
    day: 15,
    prompt:
      'All the students in the room are wearing blue shirts. Maria is a student in the room. Which of these must be true?',
    options: [
      option('language-d15-1', 'Maria is not a student.'),
      option('language-d15-2', 'The room has no other colors.'),
      option('language-d15-3', 'Maria is wearing a blue shirt.'),
      option('language-d15-4', 'Everyone wearing blue is a student.'),
    ],
    correctOptionId: 'language-d15-3',
  },
  {
    id: 'language-d16',
    category: 'language',
    day: 16,
    prompt: 'Sun is to sunburn as fire is to ___?',
    options: [
      option('language-d16-1', 'Smoke'),
      option('language-d16-2', 'Ash'),
      option('language-d16-3', 'Wood'),
      option('language-d16-4', 'Burn'),
    ],
    correctOptionId: 'language-d16-4',
  },
  {
    id: 'language-d17',
    category: 'language',
    day: 17,
    prompt: 'Because she forgot her umbrella and it started to rain, she ___.',
    options: [
      option('language-d17-1', 'got wet'),
      option('language-d17-2', 'went to school'),
      option('language-d17-3', 'ate lunch'),
      option('language-d17-4', 'watered the plants'),
    ],
    correctOptionId: 'language-d17-1',
  },
  {
    id: 'language-d18',
    category: 'language',
    day: 18,
    prompt: 'A kitten grows into a cat. A puppy grows into a ___?',
    options: [
      option('language-d18-1', 'Wolf'),
      option('language-d18-2', 'Dog'),
      option('language-d18-3', 'Fox'),
      option('language-d18-4', 'Cub'),
    ],
    correctOptionId: 'language-d18-2',
  },
  {
    id: 'language-d19',
    category: 'language',
    day: 19,
    prompt: 'Which word does NOT have a double letter: Letter, Happy, Paper, Little?',
    options: [
      option('language-d19-1', 'Letter'),
      option('language-d19-2', 'Happy'),
      option('language-d19-3', 'Paper'),
      option('language-d19-4', 'Little'),
    ],
    correctOptionId: 'language-d19-3',
  },
  {
    id: 'language-d20',
    category: 'language',
    day: 20,
    prompt:
      "Tom always brings a jacket when the forecast says it will be cold. Today's forecast says it will be cold. Which of these must be true?",
    options: [
      option('language-d20-1', 'Tom will not bring a jacket.'),
      option('language-d20-2', 'The forecast is wrong.'),
      option('language-d20-3', 'Tom does not own a jacket.'),
      option('language-d20-4', 'Tom will bring a jacket.'),
    ],
    correctOptionId: 'language-d20-4',
  },
  {
    id: 'language-d21',
    category: 'language',
    day: 21,
    prompt: 'Pilot is to airplane as captain is to ___?',
    options: [
      option('language-d21-1', 'Ship'),
      option('language-d21-2', 'Car'),
      option('language-d21-3', 'Train'),
      option('language-d21-4', 'Bicycle'),
    ],
    correctOptionId: 'language-d21-1',
  },
];

// ---------------------------------------------------------------------------
// OBSERVATION - the fifth and final production (non-stub) category: all 21
// days, following the approved blueprint. Every task is solvable entirely
// from its own prompt (text/emoji/symbol sequences only, no visual grid or
// image assets) and has exactly one objectively correct, verifiable answer.
// ---------------------------------------------------------------------------

export const OBSERVATION_TASKS: CognitiveTask[] = [
  {
    id: 'observation-d1',
    category: 'observation',
    day: 1,
    prompt: 'Look at this row of letters: K, T, R, T, M. Which letter appears twice?',
    options: [
      option('observation-d1-1', 'T'),
      option('observation-d1-2', 'K'),
      option('observation-d1-3', 'R'),
      option('observation-d1-4', 'M'),
    ],
    correctOptionId: 'observation-d1-1',
  },
  {
    id: 'observation-d2',
    category: 'observation',
    day: 2,
    prompt: 'Which of these does not belong: Table, Chair, Sofa, Cloud?',
    options: [
      option('observation-d2-1', 'Table'),
      option('observation-d2-2', 'Cloud'),
      option('observation-d2-3', 'Chair'),
      option('observation-d2-4', 'Sofa'),
    ],
    correctOptionId: 'observation-d2-2',
  },
  {
    id: 'observation-d3',
    category: 'observation',
    day: 3,
    prompt:
      'List A: Apple, Lemon, Grape, Pear. List B: Apple, Lemon, Plum, Pear. Which item appears in List A but not List B?',
    options: [
      option('observation-d3-1', 'Apple'),
      option('observation-d3-2', 'Lemon'),
      option('observation-d3-3', 'Grape'),
      option('observation-d3-4', 'Pear'),
    ],
    correctOptionId: 'observation-d3-3',
  },
  {
    id: 'observation-d4',
    category: 'observation',
    day: 4,
    prompt: 'Which number is missing from this sequence: 2, 4, 6, __, 10?',
    options: [
      option('observation-d4-1', '7'),
      option('observation-d4-2', '9'),
      option('observation-d4-3', '12'),
      option('observation-d4-4', '8'),
    ],
    correctOptionId: 'observation-d4-4',
  },
  {
    id: 'observation-d5',
    category: 'observation',
    day: 5,
    prompt: 'Look at this row: 🍎 🍌 🍇 🍌 🍉. Which emoji appears twice?',
    options: [
      option('observation-d5-1', '🍌'),
      option('observation-d5-2', '🍎'),
      option('observation-d5-3', '🍇'),
      option('observation-d5-4', '🍉'),
    ],
    correctOptionId: 'observation-d5-1',
  },
  {
    id: 'observation-d6',
    category: 'observation',
    day: 6,
    prompt: 'Look at this list: Pen, Key, Cup, Book, Key, Lamp, Shoe. Which item appears twice?',
    options: [
      option('observation-d6-1', 'Pen'),
      option('observation-d6-2', 'Key'),
      option('observation-d6-3', 'Cup'),
      option('observation-d6-4', 'Lamp'),
    ],
    correctOptionId: 'observation-d6-2',
  },
  {
    id: 'observation-d7',
    category: 'observation',
    day: 7,
    prompt: 'Row A: ⭐ ⭐ ⭐ ⭐. Row B: ⭐ ⭐ 🌙 ⭐. Which position in Row B does not match Row A?',
    options: [
      option('observation-d7-1', '1st'),
      option('observation-d7-2', '2nd'),
      option('observation-d7-3', '3rd'),
      option('observation-d7-4', '4th'),
    ],
    correctOptionId: 'observation-d7-3',
  },
  {
    id: 'observation-d8',
    category: 'observation',
    day: 8,
    prompt: 'Which emoji does not belong: 🐶 🐱 🐭 🚗 🐰?',
    options: [
      option('observation-d8-1', '🐶'),
      option('observation-d8-2', '🐱'),
      option('observation-d8-3', '🐰'),
      option('observation-d8-4', '🚗'),
    ],
    correctOptionId: 'observation-d8-4',
  },
  {
    id: 'observation-d9',
    category: 'observation',
    day: 9,
    prompt: 'Original order: Sun, Moon, Star, Cloud. New order: Sun, Star, Moon, Cloud. Which two items were swapped?',
    options: [
      option('observation-d9-1', 'Moon and Star'),
      option('observation-d9-2', 'Sun and Moon'),
      option('observation-d9-3', 'Star and Cloud'),
      option('observation-d9-4', 'Sun and Cloud'),
    ],
    correctOptionId: 'observation-d9-1',
  },
  {
    id: 'observation-d10',
    category: 'observation',
    day: 10,
    prompt: "Sentence A: 'The cat sat on the mat.' Sentence B: 'The cat sat on the hat.' Which word in Sentence B is different from Sentence A?",
    options: [
      option('observation-d10-1', 'The'),
      option('observation-d10-2', 'hat'),
      option('observation-d10-3', 'cat'),
      option('observation-d10-4', 'sat'),
    ],
    correctOptionId: 'observation-d10-2',
  },
  {
    id: 'observation-d11',
    category: 'observation',
    day: 11,
    prompt:
      'List A: Pen, Cup, Book, Lamp, Shoe, Hat, Key. List B: Pen, Cup, Book, Lamp, Shoe, Hat, Coin. Which item appears in List B but not List A?',
    options: [
      option('observation-d11-1', 'Pen'),
      option('observation-d11-2', 'Shoe'),
      option('observation-d11-3', 'Coin'),
      option('observation-d11-4', 'Key'),
    ],
    correctOptionId: 'observation-d11-3',
  },
  {
    id: 'observation-d12',
    category: 'observation',
    day: 12,
    prompt:
      'Look at this pattern: X, O, X, O, X, O, O. The pattern should keep alternating between X and O. Which position breaks the pattern?',
    options: [
      option('observation-d12-1', 'Position 3'),
      option('observation-d12-2', 'Position 5'),
      option('observation-d12-3', 'Position 6'),
      option('observation-d12-4', 'Position 7'),
    ],
    correctOptionId: 'observation-d12-4',
  },
  {
    id: 'observation-d13',
    category: 'observation',
    day: 13,
    prompt:
      'Full set: Circle, Square, Triangle, Star, Heart. Subset shown: Circle, Square, Star, Heart. Which item is missing from the subset?',
    options: [
      option('observation-d13-1', 'Triangle'),
      option('observation-d13-2', 'Circle'),
      option('observation-d13-3', 'Square'),
      option('observation-d13-4', 'Star'),
    ],
    correctOptionId: 'observation-d13-1',
  },
  {
    id: 'observation-d14',
    category: 'observation',
    day: 14,
    prompt: 'Look at this row: A, B, A, B, A. Which letter appears an odd number of times?',
    options: [
      option('observation-d14-1', 'Both A and B'),
      option('observation-d14-2', 'A'),
      option('observation-d14-3', 'B'),
      option('observation-d14-4', 'Neither'),
    ],
    correctOptionId: 'observation-d14-2',
  },
  {
    id: 'observation-d15',
    category: 'observation',
    day: 15,
    prompt:
      'Look at this sequence: 🔵 🔺 🔵 🔺 🔵 🔺 🔵 🔵. The pattern should keep alternating between 🔵 and 🔺. Which position breaks the pattern?',
    options: [
      option('observation-d15-1', 'Position 4'),
      option('observation-d15-2', 'Position 6'),
      option('observation-d15-3', 'Position 7'),
      option('observation-d15-4', 'Position 8'),
    ],
    correctOptionId: 'observation-d15-4',
  },
  {
    id: 'observation-d16',
    category: 'observation',
    day: 16,
    prompt: 'Arrangement A: Star, Moon, Sun. Arrangement B: Sun, Star, Moon. What changed between Arrangement A and Arrangement B?',
    options: [
      option('observation-d16-1', 'Star and Moon swapped places'),
      option('observation-d16-2', 'Sun was removed'),
      option('observation-d16-3', 'A new item was added'),
      option('observation-d16-4', 'Every item shifted one position (the arrangement rotated)'),
    ],
    correctOptionId: 'observation-d16-4',
  },
  {
    id: 'observation-d17',
    category: 'observation',
    day: 17,
    prompt: 'Look at this row: 🐝 🦋 🐝 🐞 🦋 🐝. How many times does 🐝 appear?',
    options: [
      option('observation-d17-1', '3'),
      option('observation-d17-2', '1'),
      option('observation-d17-3', '2'),
      option('observation-d17-4', '4'),
    ],
    correctOptionId: 'observation-d17-1',
  },
  {
    id: 'observation-d18',
    category: 'observation',
    day: 18,
    prompt:
      'Row A: 🍎 🍌 🍇 🍉 🍓. Row B: 🍓 🍎 🍌 🍇 🍉. One emoji moved to a new spot while all the others still appear in their same original order. Which emoji moved?',
    options: [
      option('observation-d18-1', '🍎'),
      option('observation-d18-2', '🍓'),
      option('observation-d18-3', '🍌'),
      option('observation-d18-4', '🍉'),
    ],
    correctOptionId: 'observation-d18-2',
  },
  {
    id: 'observation-d19',
    category: 'observation',
    day: 19,
    prompt:
      'Full set: Monday, Tuesday, Wednesday, Thursday, Friday. Subset shown: Monday, Wednesday, Thursday, Friday. Which item is missing from the subset?',
    options: [
      option('observation-d19-1', 'Monday'),
      option('observation-d19-2', 'Wednesday'),
      option('observation-d19-3', 'Tuesday'),
      option('observation-d19-4', 'Friday'),
    ],
    correctOptionId: 'observation-d19-3',
  },
  {
    id: 'observation-d20',
    category: 'observation',
    day: 20,
    prompt: 'Look at this sequence: 2, 4, 6, 8, 11, 12. Which number breaks the "add 2 each time" pattern?',
    options: [
      option('observation-d20-1', '4'),
      option('observation-d20-2', '8'),
      option('observation-d20-3', '12'),
      option('observation-d20-4', '11'),
    ],
    correctOptionId: 'observation-d20-4',
  },
  {
    id: 'observation-d21',
    category: 'observation',
    day: 21,
    prompt: 'Row A: 🌻 🌻 🌻 🌻 🌻. Row B: 🌻 🌻 🌼 🌻 🌻. Which position in Row B is different from Row A?',
    options: [
      option('observation-d21-1', '3rd'),
      option('observation-d21-2', '1st'),
      option('observation-d21-3', '2nd'),
      option('observation-d21-4', '4th'),
    ],
    correctOptionId: 'observation-d21-1',
  },
];

/** Fixed, deterministic rendering order for a day's five tasks. */
const CATEGORY_ORDER: readonly CognitiveTaskCategory[] = ['logic', 'spatial', 'memory', 'language', 'observation'];

const TASK_BANK: Record<CognitiveTaskCategory, readonly CognitiveTask[]> = {
  logic: LOGIC_TASKS,
  spatial: SPATIAL_TASKS,
  memory: MEMORY_TASKS,
  language: LANGUAGE_TASKS,
  observation: OBSERVATION_TASKS,
};

/**
 * One task from each of the five cognitive-task categories for a given
 * 21-day cycle day - Day N -> the Nth task in every category's list.
 *
 * Pure and deterministic: `day` is the only input that affects selection.
 * Never reads the Focus Number, missing/present numbers, Lo Shu counts, or
 * `completedCycleNumbers` - this resolver has no such parameters at all.
 * Never mutates `bank` (or the default `TASK_BANK`).
 *
 * Returns an empty array - never throws, never a partial set of fewer than
 * 5 - for any day without a matching entry in every category. This single
 * rule covers both genuinely invalid days (<= 0, non-integer, beyond the
 * real 21-day cycle) and, for now, days beyond this step's small stub bank:
 * once the full 105-task bank replaces the stub, every day 1-21 resolves
 * normally under the same rule.
 *
 * `bank` defaults to the real module content and exists primarily so tests
 * can exercise days (e.g. day 21) that the current small stub bank doesn't
 * reach yet, without requiring the full question bank to exist first.
 */
export function tasksForDay(
  day: number,
  bank: Record<CognitiveTaskCategory, readonly CognitiveTask[]> = TASK_BANK,
): CognitiveTask[] {
  const tasks = CATEGORY_ORDER.map((category) => bank[category][day - 1]);
  if (tasks.some((task) => task === undefined)) return [];
  return tasks;
}
