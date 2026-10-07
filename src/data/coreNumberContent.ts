/**
 * Structured, reusable interpretation content for the five Core Numbers
 * (Life Path, Destiny, Soul Urge, Personality, Birthday).
 *
 * "Calculate once -> explain once -> reuse everywhere": `buildNumerologyReport()`
 * in `src/core/numerology.ts` remains the one and only place a Core Number
 * value is calculated. Everything here only turns an already-calculated
 * value into display content - no numerology math happens in this file
 * beyond re-using the existing, exported `reduceNumber()` to resolve the
 * Birthday's traditional single-digit/master-number reading (see
 * `knownDigitFor` below). This content is intentionally structured (not a
 * single paragraph per number) so the same data can later be reused by the
 * Forecast screen, a future AI explainer, or a future PDF report, in
 * addition to the Blueprint screen it is first used for here.
 *
 * Tone: traditional/reflection-oriented ("traditionally associated with",
 * "may suggest", "can be useful to explore"), never deterministic
 * (no guarantees, health, or financial claims) and never deficiency-framed
 * (no "weak"/"bad"/"doomed" language) - see the five Core Number sections'
 * own authored text below, and `NUMBER_ESSENCE` in `./numberEssence.ts` for
 * the shared factual base every category draws from.
 */
import { reduceNumber } from '@/core/numerology';
import type { CoreNumber, NumerologyReport } from '@/core/types';
import { NUMBER_ESSENCE, type NumberEssence } from './numberEssence';

export type CoreNumberKey = 'lifePath' | 'destiny' | 'soulUrge' | 'personality' | 'birthday';

export interface CoreNumberSection {
  /** "What This Number Represents" - describes the category itself, not the user's specific value. */
  represents: string;
  /** "Your Number" / "Your Interpretation" - specific to the user's value for this category. */
  yourInterpretation: string;
  /** "How It May Show Up" */
  showsUpAs: string[];
  /** "Natural Strengths" */
  strengths: string[];
  /** "Things to Be Mindful Of" */
  mindfulOf: string[];
  /** "How You Can Use This Insight" */
  howToUse: string;
}

/**
 * Resolves any Core Number value (including a Birthday's raw, unreduced
 * 1-31 day) down to one of the values `NUMBER_ESSENCE` covers (1-9, 11, 22,
 * 33), using the same `reduceNumber()` the calculation engine already uses
 * elsewhere (e.g. for Life Path's year component) - never a second,
 * invented reduction rule. For Life Path/Destiny/Soul Urge/Personality this
 * is a no-op (those are already 1-9/11/22/33 by construction); for Birthday
 * it is the traditional "reduce the day for interpretation, but keep
 * showing the raw day" convention.
 */
function knownDigitFor(value: number): number {
  return reduceNumber(value, true).value;
}

function essenceFor(value: number): NumberEssence {
  return NUMBER_ESSENCE[knownDigitFor(value)] ?? NUMBER_ESSENCE[9];
}

// ---------------------------------------------------------------------------
// "Your Interpretation" - the user's specific value, by category.
// Life Path has its own plain-English content further below
// (`LIFE_PATH_CONTENT`) - written separately rather than reusing
// `LIFE_PATH_ARCHETYPES`, whose wording is more abstract/deterministic than
// the simpler style approved for Life Path specifically. Birthday (see
// `BIRTHDAY_THEMES` below) has likewise been revised to the same softer
// voice and to always explain a compound day's reduction BEFORE its
// traditional meaning. Personality, Destiny and Soul Urge (see
// `PERSONALITY_CONTENT`, `DESTINY_CONTENT` and `SOUL_URGE_CONTENT` below)
// each have their own bespoke content for the same reason Life Path does -
// the generic `NUMBER_ESSENCE` + `CATEGORY_FRAMING` machinery reads too
// abstract/template-y for the richer, situational treatment approved for
// them. Birthday is now the only category still generated from that shared
// machinery.
// ---------------------------------------------------------------------------

/**
 * The traditional theme for each Birthday reading (1-9, 11, 22, 33) - just
 * the meaning clause, not a full sentence. `yourInterpretationFor`'s
 * 'birthday' case below builds the full sentence around it, in an order
 * that always explains the user's actual birth day and its reduction (when
 * one applies) BEFORE explaining what the resulting number traditionally
 * means - never the reverse.
 */
const BIRTHDAY_THEMES: Record<number, string> = {
  1: 'independence and a readiness to take the lead in everyday situations',
  2: 'cooperation, and a knack for sensing what others need in everyday situations',
  3: 'self-expression, and bringing a little lightness to everyday situations',
  4: 'steady, practical follow-through and a preference for order',
  5: 'comfort with variety and change in everyday situations',
  6: 'noticing what a person or situation needs and offering care',
  7: 'quiet reflection, and noticing detail others might miss',
  8: 'organising ability and following through on practical goals',
  9: 'seeing the wider picture and a pull toward bringing things to a close',
  11: 'an intuitive streak that can show up in small, everyday moments',
  22: 'a talent for turning a practical idea into something real, even on an ordinary day',
  33: 'a pull toward supporting the people around you, carried into everyday situations',
};

function yourInterpretationFor(key: Exclude<CoreNumberKey, 'lifePath' | 'personality' | 'destiny' | 'soulUrge'>, value: number): string {
  const resolved = knownDigitFor(value);
  switch (key) {
    case 'birthday': {
      const theme = BIRTHDAY_THEMES[resolved] ?? BIRTHDAY_THEMES[9];
      const isMasterDay = resolved === 11 || resolved === 22 || resolved === 33;

      // The raw day is the canonical, unreduced value (see `trailText()` in
      // the Blueprint screen) and is never changed here. When it's already
      // a single digit or master number, no reduction happened, so there's
      // nothing to explain beyond the theme itself.
      if (value === resolved) {
        return isMasterDay
          ? `A birth day of ${value} is traditionally considered a master day, associated with ${theme}.`
          : `A birth day of ${value} is traditionally associated with ${theme}.`;
      }

      // A compound day (e.g. 25): explain the user's actual birth day and
      // its reduction FIRST, then the resulting number, then what that
      // number traditionally means - never the meaning before the "why".
      const arithmetic = String(value).split('').join(' + ');
      const resultLeadIn = isMasterDay
        ? `A birth day that reduces to ${resolved} is traditionally considered a master day, associated with`
        : `A birth day that reduces to ${resolved} is traditionally associated with`;
      return (
        `Your birth day is ${value}. For this kind of reading, it is traditionally reduced: ${arithmetic} = ${resolved}. ` +
        `${resultLeadIn} ${theme}.`
      );
    }
    default:
      return assertNever(key);
  }
}

function assertNever(key: never): never {
  throw new Error(`Unhandled CoreNumberKey: ${String(key)}`);
}

// ---------------------------------------------------------------------------
// Per-category framing - the same `NumberEssence` facts, reworded through
// each category's own lens so the five Core Numbers read as five distinct
// concepts rather than the same content repeated five times (even when two
// of a person's Core Numbers happen to share the same underlying value).
// ---------------------------------------------------------------------------

interface CategoryFraming {
  represents: string;
  showUp: (theme: string) => string;
  strength: (strength: string) => string;
  mindful: (note: string) => string;
  howToUse: (essence: NumberEssence) => string;
}

/** Life Path, Personality, Destiny and Soul Urge are deliberately absent
 *  here - each has its own bespoke content below (`LIFE_PATH_CONTENT`,
 *  `PERSONALITY_CONTENT`, `DESTINY_CONTENT`, `SOUL_URGE_CONTENT`), not
 *  generated from this generic framing. */
const CATEGORY_FRAMING: Record<Exclude<CoreNumberKey, 'lifePath' | 'personality' | 'destiny' | 'soulUrge'>, CategoryFraming> = {
  birthday: {
    represents:
      'Birthday is traditionally associated with a set of natural qualities linked to the specific day of the month you were born - a supporting layer alongside the other four Core Numbers. It is taken directly from that day, without reducing it.',
    showUp: (theme) => `A practical, everyday knack related to ${theme}`,
    strength: (strength) => `A practical asset: ${strength}.`,
    mindful: (note) => `Worth keeping in mind day to day: ${note}.`,
    howToUse: () => 'This can be a useful quality to draw on deliberately in ordinary, practical moments - at work, at home, or in how you approach a task.',
  },
};

// ---------------------------------------------------------------------------
// Life Path - bespoke, plain-English content per value (1-9, 11, 22, 33).
// Unlike the other four categories, this is NOT generated from the shared
// `NUMBER_ESSENCE` + `CATEGORY_FRAMING` machinery above: that machinery
// produces more abstract, template-y phrasing ("a recurring pull toward X,
// across different seasons of life") than approved for Life Path's plain-
// English rewrite. Destiny/Soul Urge/Personality/Birthday still use that
// shared machinery unchanged, pending the same content review.
// ---------------------------------------------------------------------------

const LIFE_PATH_REPRESENTS =
  "Life Path is traditionally considered one of the most important Core Numbers. It's associated with the overall direction of your life and the qualities you may develop through your experiences along the way.";

interface LifePathEntry {
  yourInterpretation: string;
  showsUpAs: string[];
  strengths: string[];
  mindfulOf: string[];
  howToUse: string;
}

const LIFE_PATH_CONTENT: Record<number, LifePathEntry> = {
  1: {
    yourInterpretation:
      "Life Path 1 is traditionally associated with independence and taking the lead. You may prefer figuring things out for yourself rather than waiting to be told what to do. You might also feel most comfortable when you're the one steering a project or a decision.",
    showsUpAs: [
      'You may be the one who speaks up first when a group needs a decision.',
      "You might prefer starting something new rather than following someone else's plan.",
      "When you have an idea, you may want to act on it quickly rather than wait for permission.",
    ],
    strengths: [
      "You can be a natural starter - someone who gets things moving when everyone else is hesitating.",
      "You may feel confident making a decision, even without everyone's agreement.",
      "You can be good at trusting your own judgment in unfamiliar situations.",
    ],
    mindfulOf: [
      'You may sometimes push ahead before checking whether others are on board.',
      'You might find it hard to ask for help, even when it would make things easier.',
      "You may get impatient with people or processes that move more slowly than you'd like.",
    ],
    howToUse:
      "You can lean on this quality whenever something needs a confident first step - a new project, a tough conversation, a decision no one else wants to make. At the same time, it can help to pause occasionally and bring others along with you, rather than always going it alone.",
  },
  2: {
    yourInterpretation:
      'Life Path 2 is traditionally associated with cooperation and sensitivity to other people. You may be good at noticing how others are feeling, even before they say anything. You might also prefer working alongside someone rather than handling everything by yourself.',
    showsUpAs: [
      'You may be the person others turn to when they just need someone to listen.',
      "You might naturally smooth things over when there's tension in a group.",
      'You may prefer making a decision together with someone, rather than alone.',
    ],
    strengths: [
      'You can be dependable in a partnership or team, because you genuinely consider other people\'s needs.',
      "You may have a gift for sensing what someone else is going through.",
      'You can be patient in situations that call for tact rather than force.',
    ],
    mindfulOf: [
      "You may sometimes go along with what others want, even when you'd prefer something different.",
      'You might take criticism more personally than it was meant.',
      'You may avoid a disagreement even when raising it would actually help.',
    ],
    howToUse:
      "This quality can be especially useful in any situation that calls for patience, listening, or bringing people together. At the same time, it's worth noticing when you're keeping quiet to avoid conflict instead of saying what you actually think.",
  },
  3: {
    yourInterpretation:
      'Life Path 3 is traditionally associated with self-expression and creativity. You may enjoy finding ways to put your thoughts and feelings into words, pictures, or ideas. You might also bring a sense of fun or lightness to situations that could otherwise feel heavy.',
    showsUpAs: [
      'You may find yourself the one who lifts the mood when a room feels flat.',
      'You might enjoy talking, writing, or creating as a way of working through how you feel.',
      'You may come up with several ideas quickly when a problem needs a fresh angle.',
    ],
    strengths: [
      'You can be genuinely entertaining or engaging company.',
      'You may have a knack for putting a complicated feeling or idea into simple words.',
      'You can be good at seeing the lighter side of a difficult situation.',
    ],
    mindfulOf: [
      'You may start several ideas at once and find it hard to finish all of them.',
      'You might use humour or distraction to avoid sitting with a harder feeling.',
      'You may find repetitive or routine tasks harder to stay motivated for.',
    ],
    howToUse:
      'This quality is especially useful whenever something needs to be communicated clearly or made more engaging. At the same time, it can help to pick one idea to finish before moving on to the next one.',
  },
  4: {
    yourInterpretation:
      'Life Path 4 is traditionally associated with practicality, stability and building things step by step. You may prefer having a clear plan and knowing what needs to be done before you begin. You may also take your responsibilities seriously and value things that are reliable and lasting.',
    showsUpAs: [
      'You may feel more comfortable when you have a clear plan to follow.',
      'You may naturally break a large task into smaller, manageable steps.',
      'When something goes wrong, you may look for a practical way to fix it rather than giving up.',
    ],
    strengths: [
      'You can be dependable when others need someone they can count on.',
      'You may have patience for work that takes time and consistent effort.',
      'You may be good at creating order when something feels confusing or disorganised.',
    ],
    mindfulOf: [
      'You may sometimes hold on to a plan even when circumstances have changed.',
      'You may put so much focus on getting things right that you forget to give yourself a break.',
      "You may find sudden changes uncomfortable, especially when you haven't had time to prepare.",
    ],
    howToUse:
      'You can use this quality to your advantage when something important needs steady effort. At the same time, notice when being organised helps you and when it might be keeping you from adapting to a change.',
  },
  5: {
    yourInterpretation:
      'Life Path 5 is traditionally associated with variety, freedom and adapting easily to change. You may enjoy having more than one thing going on at once, and get restless if life feels too predictable. You might also be drawn to new places, people or experiences more than most.',
    showsUpAs: [
      'You may get bored quickly if a routine stays exactly the same for too long.',
      'You might enjoy travelling, trying new things, or meeting new people more than most.',
      'When plans change at the last minute, you may adjust more easily than those around you.',
    ],
    strengths: [
      'You can be genuinely good at adapting when a situation suddenly shifts.',
      'You may bring energy and curiosity into whatever you\'re doing.',
      'You can be comfortable with uncertainty in a way that puts others at ease.',
    ],
    mindfulOf: [
      "You may lose interest in something before it's actually finished.",
      'You might commit to too many things at once and end up stretched thin.',
      "You may find long-term routines harder to stick with than you'd like.",
    ],
    howToUse:
      'This quality can be a real advantage whenever a situation calls for flexibility or fresh energy. At the same time, it can help to notice when moving on to the next thing means leaving something unfinished that mattered to you.',
  },
  6: {
    yourInterpretation:
      'Life Path 6 is traditionally associated with care, responsibility and looking after the people close to you. You may naturally notice when someone needs help, even before they ask. You might also feel most at ease when your home or close relationships feel settled.',
    showsUpAs: [
      'You may be the one family and friends turn to when something needs sorting out.',
      'You might find yourself offering help before anyone has to ask for it.',
      'You may pay close attention to making a home or shared space feel comfortable.',
    ],
    strengths: [
      'You can be genuinely caring toward the people closest to you.',
      'You may be good at noticing small things that make a real difference to someone else.',
      'You can be a steady, reassuring presence when people are struggling.',
    ],
    mindfulOf: [
      'You may take on more responsibility for others than is really yours to carry.',
      "You might find it hard to say no, even when you're already stretched thin.",
      "You may hold yourself to a standard of looking after everyone that leaves little time for you.",
    ],
    howToUse:
      'This quality is especially valuable in relationships and situations where people need real support. At the same time, it helps to check in with your own needs just as often as you check in on everyone else\'s.',
  },
  7: {
    yourInterpretation:
      "Life Path 7 is traditionally associated with reflection, analysis and wanting to understand things more deeply. You may prefer to think something through on your own before talking about it. You might also feel drawn to questions that don't have a simple, obvious answer.",
    showsUpAs: [
      "You may need some quiet time alone to process something before you're ready to discuss it.",
      "You might ask more questions than most people before you're satisfied with an answer.",
      'You may notice small details or inconsistencies that others tend to miss.',
    ],
    strengths: [
      'You can be genuinely thoughtful, taking time to consider something properly.',
      'You may be comfortable spending time alone without feeling like something is missing.',
      "You can be good at spotting what's really going on underneath a situation.",
    ],
    mindfulOf: [
      'You may keep your thoughts to yourself even when sharing them would help.',
      "You might overthink a decision that didn't really need that much analysis.",
      "You may come across as distant when you're actually just deep in thought.",
    ],
    howToUse:
      "This quality is especially useful for anything that benefits from careful thought rather than a quick reaction. At the same time, it can help to share what you're thinking sooner, rather than waiting until you've worked it all out alone.",
  },
  8: {
    yourInterpretation:
      'Life Path 8 is traditionally associated with ambition, organisation and getting practical results. You may feel motivated by having a clear goal to work toward. You might also feel comfortable taking charge when a situation needs direction.',
    showsUpAs: [
      "You may set yourself goals and feel restless until you've made progress on them.",
      'You might naturally step into a leadership role when a group needs direction.',
      'You may judge how well something is going by looking at the actual results.',
    ],
    strengths: [
      'You can be genuinely effective at organising people or resources to get something done.',
      "You may have real persistence when you're working toward something that matters to you.",
      'You can be comfortable taking responsibility for a decision.',
    ],
    mindfulOf: [
      'You may focus so much on the end result that you overlook how you got there.',
      'You might take on more than you can realistically manage at once.',
      'You may judge your own progress mainly by what can be measured or shown.',
    ],
    howToUse:
      'This quality is especially useful when something needs strong follow-through to actually get finished. At the same time, it can help to notice progress that doesn\'t show up as an obvious result - it still counts.',
  },
  9: {
    yourInterpretation:
      "Life Path 9 is traditionally associated with compassion, a broad view of life and a pull toward finishing what's been started. You may naturally think about how something affects people beyond just yourself. You might also feel a quiet need to bring things to a proper close rather than leave them hanging.",
    showsUpAs: [
      "You may feel for people going through something, even if you don't know them well.",
      'You might think about the bigger picture of a situation rather than just your own part in it.',
      'You may feel uneasy leaving something unfinished or a relationship unresolved.',
    ],
    strengths: [
      'You can be genuinely compassionate toward people outside your immediate circle.',
      'You may be good at seeing more than one side of a complicated situation.',
      "You can be comfortable letting go of something once it's truly done.",
    ],
    mindfulOf: [
      "You may find it hard to walk away from a person or cause even when it's time to.",
      'You might give more than you have to spare, and end up with little left for yourself.',
      'You may carry other people\'s problems longer than is good for you.',
    ],
    howToUse:
      'This quality is especially valuable in situations that call for empathy or a wider perspective. At the same time, it helps to notice when giving to others has started to come at your own expense.',
  },
  11: {
    yourInterpretation:
      'Life Path 11 is traditionally considered a master number, associated with heightened intuition and inspiring others. You may pick up on things before you can fully explain why, and often turn out to be right. You might also feel a stronger pull than most toward ideas, insight or a sense of meaning.',
    showsUpAs: [
      'You may get a strong gut feeling about a person or situation before you have any real evidence.',
      'You might find yourself inspiring other people, even without trying to.',
      'You may feel more affected by atmosphere, mood or energy in a room than most people do.',
    ],
    strengths: [
      'You can have genuinely sharp instincts, especially about people.',
      'You may naturally encourage others simply by sharing what you see.',
      'You can be open to ideas or possibilities that others might dismiss too quickly.',
    ],
    mindfulOf: [
      'You may feel overwhelmed more easily in tense or emotionally charged situations.',
      "You might put pressure on yourself to live up to a sense that you're meant for something big.",
      'You may find it hard to explain an instinct in a way others find convincing.',
    ],
    howToUse:
      'This quality is especially valuable in situations that call for insight or encouraging others. At the same time, it helps to look after your own energy, since this kind of sensitivity can be tiring if it\'s not balanced with rest.',
  },
  22: {
    yourInterpretation:
      'Life Path 22 is traditionally considered a master number, associated with turning a big vision into something real and lasting. You may be drawn to ambitious, long-term projects rather than small, short-term ones. You might also combine practical skill with a genuine sense of purpose about what you\'re building.',
    showsUpAs: [
      'You may find yourself planning years ahead rather than just the next few weeks.',
      'You might take on projects that feel too big for most people to attempt.',
      'You may naturally combine a bigger vision with the practical steps needed to get there.',
    ],
    strengths: [
      'You can be genuinely capable of turning a large idea into something workable.',
      'You may have real patience for projects that take a long time to pay off.',
      'You can stay steady under pressure when a lot is riding on the outcome.',
    ],
    mindfulOf: [
      'You may feel daunted by the size of what you can see is possible.',
      "You might set a standard for yourself that's difficult to keep up with.",
      'You may push through tiredness for longer than is actually good for you.',
    ],
    howToUse:
      'This quality is especially valuable for projects that need both vision and follow-through. At the same time, it helps to break a big goal into smaller wins you can actually feel good about along the way.',
  },
  33: {
    yourInterpretation:
      'Life Path 33 is traditionally considered a master number, associated with deep compassion and a pull toward helping others on a larger scale. You may find yourself naturally supporting people through difficult moments. You might also feel a strong sense of responsibility toward the wellbeing of people around you.',
    showsUpAs: [
      "You may be the person people come to when they're going through something hard.",
      'You might feel a pull to teach, guide or mentor others, even informally.',
      "You may feel other people's emotions almost as strongly as your own.",
    ],
    strengths: [
      "You can be genuinely devoted to helping the people in your life grow.",
      'You may have a deep well of patience and empathy for others.',
      'You can create a sense of safety for people who are struggling.',
    ],
    mindfulOf: [
      'You may carry other people\'s emotional weight for longer than is good for you.',
      "You might lose track of your own needs while focused on everyone else's.",
      'You may find it hard to set limits on how much you give.',
    ],
    howToUse:
      "This quality is especially valuable in any role where people need genuine support or guidance. At the same time, it helps to set clear limits, so caring for others doesn't come at the cost of caring for yourself.",
  },
};

function buildLifePathSection(value: number): CoreNumberSection {
  const entry = LIFE_PATH_CONTENT[knownDigitFor(value)] ?? LIFE_PATH_CONTENT[9];
  return { represents: LIFE_PATH_REPRESENTS, ...entry };
}

// ---------------------------------------------------------------------------
// Personality - bespoke, outward-impression-focused content per value
// (1-9, 11, 22, 33), in the same structured shape and plain-English voice
// as `LIFE_PATH_CONTENT` above. Unlike Life Path (broader life direction),
// every field here is deliberately framed around how the quality may come
// across to OTHERS - first meetings, conversations, group discussions,
// work/collaboration, social situations, unfamiliar environments - rather
// than Life Path's internal/behavioural framing, so the two categories stay
// genuinely distinct even when they resolve to the same underlying digit.
// ---------------------------------------------------------------------------

const PERSONALITY_REPRESENTS =
  'Personality is traditionally associated with the outward impression a person may tend to give, especially on a first meeting. It is calculated from the consonants in your full birth name.';

/** Same shape as `LifePathEntry` - Personality's content is structured
 *  identically, just written through its own outward-impression lens. */
type PersonalityEntry = LifePathEntry;

const PERSONALITY_CONTENT: Record<number, PersonalityEntry> = {
  1: {
    yourInterpretation:
      'Personality 1 is often associated with coming across as direct and self-assured. In a first meeting, people may notice your confidence before anything else, and you can seem comfortable stepping into a leading role without being asked. This outward style traditionally suggests someone who is easy to read as decisive, even if that\'s not quite how you\'d describe yourself privately.',
    showsUpAs: [
      'In a first meeting, you may come across as confident and ready to take charge of the conversation.',
      'In a group discussion, you might be the one who states an opinion clearly while others are still deciding what they think.',
      'In an unfamiliar environment, you may appear more at ease than you actually feel, simply because you tend to act quickly.',
    ],
    strengths: [
      'You can come across as someone people are willing to follow, even on short acquaintance.',
      'You may be seen as clear and straightforward in how you communicate.',
      "Others might find your directness refreshing in a group that's struggling to decide on anything.",
    ],
    mindfulOf: [
      'You may come across as more certain than you actually feel, which can make it harder for others to offer a different view.',
      'In a group setting, you might unintentionally take up more space in the conversation than you mean to.',
      "People meeting you for the first time may read your confidence as impatience if a decision is taking too long.",
    ],
    howToUse:
      "This outward style can work in your favour whenever a group needs someone to speak first or make a call. At the same time, it can help to consciously leave a pause for others to weigh in, especially in a first meeting or a new group.",
  },
  2: {
    yourInterpretation:
      'Personality 2 is often associated with a gentle, approachable presence. In conversation, people may find it easy to open up to you, and you can seem like someone who listens more than they talk. This outward style traditionally suggests someone who puts others at ease quickly, even in an unfamiliar environment.',
    showsUpAs: [
      'In a first meeting, you may come across as warm and easy to talk to, rather than someone who dominates the conversation.',
      "In a group discussion, you might be the one who notices when someone hasn't had a chance to speak yet.",
      'In a work setting, you may be seen as someone who smooths over tension rather than adding to it.',
    ],
    strengths: [
      "You can come across as genuinely easy to approach, even to people who don't know you well.",
      'Others may feel comfortable being candid with you sooner than they would with most people.',
      'In a group, you might be seen as the one holding things together when discussion gets tense.',
    ],
    mindfulOf: [
      'Your quietness in a group discussion may be read as agreement, even when you actually see things differently.',
      'In an unfamiliar environment, you might come across as hesitant rather than simply observant.',
      'People may lean on you to mediate, without realising how much energy that takes from you.',
    ],
    howToUse:
      "This outward style is especially useful in any social or work situation that needs someone calm and approachable. At the same time, it can help to make your own view clear occasionally, rather than letting your agreeableness be assumed.",
  },
  3: {
    yourInterpretation:
      "Personality 3 is often associated with coming across as expressive and easy to warm to. In a first meeting, people may notice your energy or sense of humour before anything else, and conversation with you can feel lively rather than effortful. This outward style traditionally suggests someone who's remembered after a single conversation.",
    showsUpAs: [
      'In a first meeting, you may come across as talkative and quick to find something to laugh about.',
      'In a group discussion, you might be the one who lightens the mood when things get tense.',
      'In a work setting, you may be seen as someone who makes a presentation or update more engaging than it needed to be.',
    ],
    strengths: [
      'You can come across as genuinely good company, even to people meeting you for the first time.',
      'Others may find it easy to remember you after a brief conversation.',
      'In a group, you might be seen as the person who keeps energy up when everyone else is flagging.',
    ],
    mindfulOf: [
      'Your humour in a serious conversation may come across as not taking the situation seriously enough.',
      'In a first meeting, you might be seen as talkative before people get to know the more thoughtful side of you.',
      "People may expect you to always be \"on\", which can be tiring to live up to.",
    ],
    howToUse:
      'This outward style works well in any social or collaborative situation that benefits from energy and warmth. At the same time, it can help to let a quieter, more serious moment stay quiet, rather than reaching to lighten it.',
  },
  4: {
    yourInterpretation:
      'Personality 4 is often associated with coming across as grounded and dependable. In a work setting, people may notice your steadiness before anything else, and you can seem organised even in situations that feel chaotic to others. This outward style traditionally suggests someone others are comfortable relying on.',
    showsUpAs: [
      'In a first meeting, you may come across as measured and a little formal, rather than immediately casual.',
      'In a group discussion, you might be the one who asks what the actual plan is.',
      'In an unfamiliar environment, you may appear calm simply because you default to figuring out the practical steps first.',
    ],
    strengths: [
      "You can come across as someone whose word can be trusted, even to people who've just met you.",
      'Others may feel reassured by how steady you seem under pressure.',
      'In a work setting, you might be seen as the person who keeps a project from falling apart.',
    ],
    mindfulOf: [
      'Your steadiness may be read as rigidity by someone meeting you for the first time.',
      "In a group discussion, you might come across as resistant to a new idea simply because you're weighing it carefully.",
      "People may assume you're unbothered by change, when you're actually just slower to show it.",
    ],
    howToUse:
      "This outward style is especially valuable in any situation that needs a visibly reliable presence. At the same time, it can help to show a little more flexibility early in a new relationship or group, so your steadiness doesn't read as inflexibility.",
  },
  5: {
    yourInterpretation:
      'Personality 5 is often associated with coming across as energetic and open. In an unfamiliar environment, people may notice how quickly you adapt, and conversation with you can feel wide-ranging rather than predictable. This outward style traditionally suggests someone who seems comfortable almost anywhere.',
    showsUpAs: [
      'In a first meeting, you may come across as curious, asking more questions about the other person than expected.',
      'In a group discussion, you might be the one who brings up a tangent that turns out to be relevant.',
      'In a work setting, you may be seen as someone who adjusts to a sudden change in plan faster than others.',
    ],
    strengths: [
      'You can come across as easy to talk to about almost any topic.',
      "Others may find your adaptability reassuring in a fast-changing situation.",
      'In an unfamiliar environment, you might be the one who seems least thrown by the unexpected.',
    ],
    mindfulOf: [
      'Your enthusiasm for a new topic may come across as not finishing the last one.',
      'In a group discussion, you might be seen as scattered if you bring in too many directions at once.',
      'People may find it hard to pin down where you stand, since you seem open to several options at once.',
    ],
    howToUse:
      "This outward style is especially useful in situations that call for adaptability or fresh energy. At the same time, it can help to signal clearly when you're actually committed to a direction, so others aren't left guessing.",
  },
  6: {
    yourInterpretation:
      'Personality 6 is often associated with coming across as warm and attentive. In a group, people may notice that you check in on others before yourself, and conversation with you can feel genuinely caring rather than just polite. This outward style traditionally suggests someone others feel comfortable bringing a problem to.',
    showsUpAs: [
      'In a first meeting, you may come across as considerate, asking about the other person rather than talking mainly about yourself.',
      "In a group discussion, you might be the one who notices if someone seems upset, even if it's off-topic.",
      'In a work setting, you may be seen as someone who looks out for the team, not just the task.',
    ],
    strengths: [
      "You can come across as genuinely warm, even to people who've just met you.",
      'Others may feel comfortable bringing a personal concern to you fairly quickly.',
      "In a group, you might be seen as the one who makes sure no one's being left out.",
    ],
    mindfulOf: [
      'Your attentiveness to others may come across as not having your own needs or opinions.',
      "In a work setting, you might be seen as someone who'll take on more than their share without being asked.",
      "People may assume you're always available to help, since you rarely say otherwise.",
    ],
    howToUse:
      "This outward style is especially valuable in any relationship or team that benefits from someone paying attention to others' wellbeing. At the same time, it can help to let people see when you need something too, rather than only being the one who gives.",
  },
  7: {
    yourInterpretation:
      'Personality 7 is often associated with coming across as thoughtful and a little reserved. In a first meeting, people may notice that you listen more than you speak, and conversation with you can feel considered rather than quick. This outward style traditionally suggests someone others sense is quietly paying close attention.',
    showsUpAs: [
      "In a first meeting, you may come across as quiet or hard to read, even if you're genuinely interested.",
      'In a group discussion, you might be the one who waits until everyone else has spoken before adding something that reframes the whole conversation.',
      'In an unfamiliar environment, you may seem to be observing more than participating at first.',
    ],
    strengths: [
      "You can come across as someone whose opinion is worth waiting for, once people get to know you.",
      "Others may sense that you've actually thought about what they said, rather than just reacting.",
      "In a group, you might be seen as a calming presence simply because you don't rush to fill silence.",
    ],
    mindfulOf: [
      "Your quietness in a first meeting may be read as disinterest or distance, when you're actually just taking it in.",
      "In a group discussion, you might come across as hard to connect with until you've spoken a few times.",
      'People may assume you have nothing to say, simply because you take longer to say it.',
    ],
    howToUse:
      "This outward style works well in any setting where a considered perspective is more useful than a quick one. At the same time, it can help to offer a small signal early on - a question, a nod, a brief comment - so a first meeting doesn't read as distance.",
  },
  8: {
    yourInterpretation:
      'Personality 8 is often associated with coming across as confident and capable. In a work setting, people may notice your composure before anything else, and you can seem comfortable with responsibility that others might find daunting. This outward style traditionally suggests someone who looks like they already have things under control.',
    showsUpAs: [
      'In a first meeting, you may come across as self-assured, particularly on topics related to work or achievement.',
      'In a group discussion, you might be the one people look to when a decision needs to actually get made.',
      "In an unfamiliar environment, you may appear composed, even if you're assessing the situation as carefully as everyone else.",
    ],
    strengths: [
      "You can come across as someone capable of handling a difficult situation, even to people who've just met you.",
      'Others may feel reassured by how in-control you seem under pressure.',
      'In a group, you might be seen as the person who turns talk into an actual decision.',
    ],
    mindfulOf: [
      'Your composure may come across as unapproachable or intimidating to someone meeting you for the first time.',
      "In a group discussion, you might be seen as impatient if things aren't moving toward a result quickly enough.",
      "People may assume you don't need support, simply because you rarely show that you do.",
    ],
    howToUse:
      "This outward style is especially valuable in any situation that calls for a visibly capable presence. At the same time, it can help to show a little more openness early in a relationship, so your composure doesn't read as distance.",
  },
  9: {
    yourInterpretation:
      'Personality 9 is often associated with coming across as broad-minded and easy to approach. In conversation, people may notice that you see more than one side of a situation, and you can seem genuinely interested in people outside your usual circle. This outward style traditionally suggests someone others find easy to confide in, even briefly.',
    showsUpAs: [
      'In a first meeting, you may come across as open-minded, asking questions that show real curiosity about someone different from you.',
      'In a group discussion, you might be the one who points out a perspective no one else has raised.',
      'In a social situation, you may seem comfortable talking to a wide range of people rather than sticking to one group.',
    ],
    strengths: [
      "You can come across as genuinely non-judgmental, even to someone meeting you for the first time.",
      "Others may sense that you're considering the bigger picture rather than just your own interests.",
      'In a group, you might be seen as someone who helps people feel included.',
    ],
    mindfulOf: [
      "Your broad-mindedness may come across as vagueness if you don't also state where you personally stand.",
      "In a group discussion, you might be seen as uninvolved if you're mainly listening to every side.",
      "People may expect you to always have room for one more person's problem, which can be a lot to carry.",
    ],
    howToUse:
      "This outward style is especially useful in any setting that benefits from someone who includes different perspectives. At the same time, it can help to state your own view clearly sometimes, so broad-mindedness doesn't read as indecision.",
  },
  11: {
    yourInterpretation:
      'Personality 11 is traditionally considered a master number and is often associated with coming across as intuitive and quietly striking. In conversation, people may sense there\'s more going on beneath the surface, and you can seem to pick up on things others miss. This outward style traditionally suggests someone others turn to for a different kind of perspective.',
    showsUpAs: [
      'In a first meeting, you may come across as perceptive, noticing something about the situation that others hadn\'t mentioned.',
      "In a group discussion, you might be the one whose comment unexpectedly shifts how everyone's thinking about the topic.",
      'In an unfamiliar environment, you may seem unusually attuned to the mood of the room.',
    ],
    strengths: [
      'You can come across as someone with a genuinely original take, even in a brief conversation.',
      'Others may find themselves affected by your energy or insight without being able to fully explain why.',
      'In a group, you might be seen as someone worth asking what they actually think.',
    ],
    mindfulOf: [
      'Your sensitivity may come across as intensity to someone meeting you for the first time.',
      "In a group discussion, you might come across as hard to read if your insight isn't accompanied by an explanation.",
      'People may put more weight on your impressions than you intended, simply because they land so specifically.',
    ],
    howToUse:
      'This outward style is especially valuable in situations that benefit from a genuinely different perspective. At the same time, it can help to explain the reasoning behind an instinct, so it lands as insight rather than mystery.',
  },
  22: {
    yourInterpretation:
      'Personality 22 is traditionally considered a master number and is often associated with coming across as both capable and visionary. In a work setting, people may notice that you talk about a big idea in very practical terms, which can make an ambitious plan sound achievable. This outward style traditionally suggests someone others trust with something large.',
    showsUpAs: [
      'In a first meeting, you may come across as someone thinking several steps ahead, even in a casual conversation.',
      'In a group discussion, you might be the one who turns an abstract idea into an actual next step.',
      'In a work setting, you may be seen as comfortable with a scale of project that would overwhelm most people.',
    ],
    strengths: [
      'You can come across as someone who makes a large undertaking feel genuinely possible.',
      "Others may trust you with responsibility beyond what's typical for your experience.",
      'In a group, you might be seen as the one who keeps a big vision from staying just a nice idea.',
    ],
    mindfulOf: [
      'Your focus on long-term plans may come across as detached from everyday, smaller concerns.',
      "In a group discussion, you might come across as overly serious if the scale of what you're thinking about isn't shared.",
      'People may expect you to carry a project single-handedly, simply because you seem capable of it.',
    ],
    howToUse:
      'This outward style is especially valuable for any project that needs someone to hold both the vision and the practical plan. At the same time, it can help to share the smaller, achievable steps along the way, not just the end goal.',
  },
  33: {
    yourInterpretation:
      'Personality 33 is traditionally considered a master number and is often associated with coming across as warm and quietly devoted. In conversation, people may notice that you focus on how they\'re doing, and you can seem like someone who genuinely wants to help, not just appear helpful. This outward style traditionally suggests someone others feel safe opening up to.',
    showsUpAs: [
      'In a first meeting, you may come across as unusually attentive, remembering small details about what someone said.',
      'In a group discussion, you might be the one people glance at when they need reassurance, without anyone saying anything.',
      'In a social situation, you may seem to naturally end up supporting whoever is struggling most.',
    ],
    strengths: [
      "You can come across as deeply genuine, even to someone who's just met you.",
      'Others may feel unusually safe being vulnerable with you, sooner than they would with most people.',
      'In a group, you might be seen as the person who makes sure no one is struggling alone.',
    ],
    mindfulOf: [
      'Your warmth may come across as having no limits, which can invite more than you meant to take on.',
      'In a group discussion, you might be seen as self-sacrificing if you consistently put others first.',
      'People may lean on you by default, simply because you rarely suggest otherwise.',
    ],
    howToUse:
      'This outward style is especially valuable in any role where people need to feel genuinely supported. At the same time, it can help to let others see when you need care too, rather than only being the one who provides it.',
  },
};

function buildPersonalitySection(value: number): CoreNumberSection {
  const entry = PERSONALITY_CONTENT[knownDigitFor(value)] ?? PERSONALITY_CONTENT[9];
  return { represents: PERSONALITY_REPRESENTS, ...entry };
}

// ---------------------------------------------------------------------------
// Destiny - bespoke, Expression-focused content per value (1-9, 11, 22, 33),
// in the same structured shape and plain-English voice as `LIFE_PATH_CONTENT`
// and `PERSONALITY_CONTENT` above. Every field here is framed around the
// abilities and potential a person may naturally be able to express
// (Destiny's traditional meaning) - distinct from Life Path's broad life
// direction and Personality's outward first-impression framing. Preserves
// the traditional theme already represented by each digit's entry in
// `DESTINY_ARCHETYPES` (see `src/core/archetypes.ts`, left untouched and
// still used elsewhere), but written in reflective, non-deterministic
// language rather than that table's "your mission/purpose/calling" phrasing.
// ---------------------------------------------------------------------------

const DESTINY_REPRESENTS =
  'Destiny - sometimes called Expression - is traditionally associated with the abilities and potential a person may naturally be able to express. It is calculated from every letter of your full birth name.';

/** Same shape as `LifePathEntry` - Destiny's content is structured
 *  identically, just written through its own Expression lens. */
type DestinyEntry = LifePathEntry;

const DESTINY_CONTENT: Record<number, DestinyEntry> = {
  1: {
    yourInterpretation:
      'Destiny 1 is traditionally associated with expressing self-direction and original thinking through your abilities. This can point toward a working style where you prefer finding your own solution rather than following an existing one, and where your contribution often takes the form of starting something rather than maintaining it. People with this number are often described as able to turn an idea into self-directed action.',
    showsUpAs: [
      'At work, this may show up as volunteering to lead a new initiative rather than waiting for a role to be assigned.',
      'When solving a problem, you may default to working out your own approach before looking at how others have done it.',
      'In a leadership role, this can be expressed through setting a clear direction and expecting people to run with it.',
    ],
    strengths: [
      "Your abilities may be particularly well expressed through starting things that don't yet have an established way of doing them.",
      'You can be effective at turning an idea into a first, workable version before anyone else has committed to it.',
      'This pattern often supports clear, decisive communication, especially when a decision needs to be made quickly.',
    ],
    mindfulOf: [
      'When overextended, this quality can show up as taking on a leading role even in situations where collaboration would serve better.',
      "This can sometimes become a reluctance to build on an existing system rather than starting fresh.",
      'Others may experience this expression as moving ahead without enough shared agreement first.',
    ],
    howToUse:
      "This can be useful to explore in work or projects that genuinely need someone to take the first step, rather than situations that are already well established. It may also help to notice moments where contributing to an existing plan would express this ability just as well as starting a new one.",
  },
  2: {
    yourInterpretation:
      'Destiny 2 is traditionally associated with expressing yourself through bringing people and perspectives into alignment. This can point toward abilities that show up most clearly in collaboration - listening carefully, noticing where two sides actually agree, and helping a group move forward together. People with this number are often described as a steadying presence in a disagreement.',
    showsUpAs: [
      'In a group project, this may show up as being the one who finds a compromise everyone can actually accept.',
      'In communication, you may be good at reflecting back what someone meant, not just what they said.',
      'In collaboration, this can be expressed through quietly making sure every voice in the room gets heard.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through mediating between people with different views.',
      "You can be effective at building trust in a working relationship over time, through consistency rather than grand gestures.",
      'This pattern often supports careful, diplomatic communication under pressure.',
    ],
    mindfulOf: [
      'When overextended, this quality can show up as smoothing over a disagreement that actually needed to be had.',
      "This can sometimes become a tendency to let your own contribution go unspoken in favour of the group's.",
      "Others may experience this expression as indecisiveness, when it's actually careful consideration.",
    ],
    howToUse:
      "This can be useful to explore in any collaborative project where trust and alignment matter more than speed. It may also help to notice when stating your own view clearly would serve the group better than facilitating everyone else's.",
  },
  3: {
    yourInterpretation:
      "Destiny 3 is traditionally associated with expressing yourself through creativity and the way you put ideas into words. This can point toward abilities that show up most naturally when you're explaining, presenting, or making something - turning an idea into words, images, or a story others can engage with. People with this number are often described as the one who makes an idea land.",
    showsUpAs: [
      'At work, this may show up as being asked to present an update because others find your version easier to follow.',
      "In creative problem solving, you may enjoy finding an unconventional angle before settling into a structured one.",
      'In collaboration, this can be expressed through lightening a tense meeting at exactly the right moment.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through making a complex idea easier for others to grasp.',
      'You can be effective at generating a genuinely new angle when a group feels stuck.',
      'This pattern often supports engaging, memorable communication, in writing or in person.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as prioritising how something is expressed over whether it's actually finished.",
      'This can sometimes become a pattern of moving on to a new idea before the current one is fully developed.',
      'Others may experience this expression as less serious, even when the underlying thinking is sound.',
    ],
    howToUse:
      "This can be useful to explore in any role where communication or creative framing genuinely changes the outcome. It may also help to pair this ability with a concrete finishing step, so an engaging idea also becomes a completed one.",
  },
  4: {
    yourInterpretation:
      "Destiny 4 is traditionally associated with expressing yourself through building durable, dependable systems. This can point toward abilities that show up most clearly in the practical, unglamorous work of making something reliable - a process, a structure, an agreement that holds up over time. People with this number are often described as the one whose work doesn't need to be redone.",
    showsUpAs: [
      "At work, this may show up as being the person who documents a process so it still works when you're not there.",
      'When solving a problem, you may prefer a thorough, step-by-step approach over a quick fix.',
      'In a responsibility-sharing situation, this can be expressed through being the one others trust to actually follow through.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through creating something that keeps working long after the initial effort.',
      "You can be effective at bringing order to a process that's become inconsistent or unreliable.",
      'This pattern often supports steady, trustworthy communication, especially when people need a straight answer.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as resisting a genuinely better way of doing something because it isn't the established way.",
      "This can sometimes become an unwillingness to delegate, out of concern the result won't hold up.",
      'Others may experience this expression as overly cautious in a situation that actually calls for speed.',
    ],
    howToUse:
      "This can be useful to explore in any project or responsibility that needs to last rather than just launch. It may also help to notice when a system you built could flex a little, rather than holding it rigidly to its original form.",
  },
  5: {
    yourInterpretation:
      'Destiny 5 is traditionally associated with expressing yourself through flexibility and guiding people through a transition. This can point toward abilities that show up most clearly when a plan needs to shift - helping yourself and others move through uncertainty rather than resist it. People with this number are often described as someone who makes a shift feel less disruptive.',
    showsUpAs: [
      'At work, this may show up as being comfortable picking up a new tool or process faster than most colleagues.',
      'In a group facing an unexpected change, you may be the one who starts looking for the next workable option.',
      'In learning, this can be expressed through genuinely enjoying a new subject rather than tolerating it.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through helping a team adjust when a plan has to change.',
      'You can be effective at keeping morale up during a period of real uncertainty.',
      'This pattern often supports lively, adaptable communication across very different audiences.',
    ],
    mindfulOf: [
      'When overextended, this quality can show up as moving toward the next change before the current one has settled.',
      "This can sometimes become restlessness with a project that's working fine as it is.",
      'Others may experience this expression as unpredictable, even when you yourself feel consistent.',
    ],
    howToUse:
      "This can be useful to explore in any role or project that's genuinely in flux, where adaptability is a real asset rather than a distraction. It may also help to deliberately commit to seeing one change through before looking for the next one.",
  },
  6: {
    yourInterpretation:
      'Destiny 6 is traditionally associated with expressing yourself through care and a sense of duty toward others. This can point toward abilities that show up most clearly in roles where people\'s wellbeing is part of the work - supporting a team, a family, or a community in a tangible way. People with this number are often described as someone whose contribution others genuinely feel.',
    showsUpAs: [
      "At work, this may show up as naturally taking on the parts of a project that involve looking after other people's needs.",
      "In a responsibility-sharing situation, you may be the one who notices when someone's workload has become unfair.",
      'In relationships, this can be expressed through consistent, practical support rather than just good intentions.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through creating a genuinely supportive environment for others.',
      'You can be effective at noticing a need before it becomes a problem.',
      'This pattern often supports warm, reassuring communication, especially under stress.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as taking on responsibility for outcomes that weren't really yours to carry.",
      'This can sometimes become difficulty setting a boundary, even when one is clearly needed.',
      'Others may experience this expression as over-involvement, even when it comes from genuine care.',
    ],
    howToUse:
      "This can be useful to explore in any role that benefits from someone genuinely attentive to people's needs, not just the task. It may also help to set a clear limit on what you take responsibility for, so the care stays sustainable.",
  },
  7: {
    yourInterpretation:
      'Destiny 7 is traditionally associated with expressing yourself through careful reasoning and depth of understanding. This can point toward abilities that show up most clearly in work that rewards sitting with a problem rather than rushing past it. People with this number are often described as someone whose conclusions are worth waiting for.',
    showsUpAs: [
      'At work, this may show up as being the person who catches the flaw in a plan everyone else approved too quickly.',
      'In problem solving, you may prefer to fully understand the cause before proposing a fix.',
      'In learning, this can be expressed through genuinely enjoying going deeper into a subject than the task required.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through thorough, well-reasoned analysis.',
      'You can be effective at spotting a problem others have missed, simply by looking more closely.',
      "This pattern often supports precise, considered communication once you've actually formed a view.",
    ],
    mindfulOf: [
      'When overextended, this quality can show up as taking longer than the situation actually allows.',
      'This can sometimes become a reluctance to share an unfinished thought, even when it would be useful early.',
      "Others may experience this expression as detached, when it's really just concentration.",
    ],
    howToUse:
      "This can be useful to explore in any role where getting something right matters more than getting it fast. It may also help to share your thinking in smaller pieces along the way, rather than only once it feels complete.",
  },
  8: {
    yourInterpretation:
      'Destiny 8 is traditionally associated with expressing yourself through practical ambition and the responsible use of resources. This can point toward abilities that show up most clearly in organising people, money, or effort toward a concrete result. People with this number are often described as someone who can turn a plan into something that actually happens.',
    showsUpAs: [
      'At work, this may show up as being the one who translates a strategy into a workable budget or timeline.',
      'In a leadership role, you may be comfortable making a call that affects resources or outcomes for a group.',
      'In decision making, this can be expressed through weighing the practical cost and benefit before committing.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through organising resources so a large goal becomes achievable.',
      "You can be effective at keeping a project accountable to its actual results.",
      'This pattern often supports confident, results-focused communication, especially with stakeholders.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as measuring a contribution only by what's visible or countable.",
      "This can sometimes become an underestimation of effort that doesn't produce an immediate, obvious result.",
      'Others may experience this expression as overly focused on outcomes at the expense of process.',
    ],
    howToUse:
      "This can be useful to explore in any project that needs someone to take responsibility for making a result actually happen. It may also help to deliberately notice and name the progress that doesn't show up on a balance sheet.",
  },
  9: {
    yourInterpretation:
      'Destiny 9 is traditionally associated with expressing yourself through a wider sense of contribution, beyond your immediate circle. This can point toward abilities that show up most clearly when a role lets you consider the effect of your work on people you may never meet. People with this number are often described as someone who thinks beyond their own stake in the outcome.',
    showsUpAs: [
      'At work, this may show up as asking how a decision affects people outside the immediate team.',
      'In collaboration, you may be the one who advocates for an option that benefits the wider group, not just your part of it.',
      'In a learning or mentoring situation, this can be expressed through genuinely wanting to pass on what you know.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through work that has a broad or communal benefit.',
      "You can be effective at seeing past a narrow interpretation of a task to its wider purpose.",
      'This pattern often supports generous, inclusive communication, especially in a diverse group.',
    ],
    mindfulOf: [
      'When overextended, this quality can show up as taking on more causes than you can realistically support.',
      "This can sometimes become a difficulty finishing a role once its main purpose feels served.",
      'Others may experience this expression as idealistic, especially under practical constraints.',
    ],
    howToUse:
      "This can be useful to explore in any role with a genuine wider impact, not just a narrow task. It may also help to pick one or two contributions to focus on well, rather than spreading this instinct across everything at once.",
  },
  11: {
    yourInterpretation:
      'Destiny 11 is traditionally considered a master number and is often associated with expressing yourself through insight that bridges intuition and practical impact. This can point toward abilities that show up when a role lets you combine a strong instinct with genuine influence on others. People with this number are often described as someone whose perspective changes how a group sees a situation.',
    showsUpAs: [
      'At work, this may show up as raising a point in a meeting that reframes the whole discussion.',
      'In a mentoring or leadership role, you may inspire people through example more than through instruction.',
      "In creative or strategic work, this can be expressed through seeing a connection others hadn't noticed yet.",
    ],
    strengths: [
      'Your abilities may be particularly well expressed through offering a perspective that genuinely shifts how others think about a problem.',
      "You can be effective at sensing the right direction before the practical case for it is fully clear.",
      'This pattern often supports communication that resonates with people beyond what the words alone explain.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as expecting others to follow an instinct you haven't fully explained.",
      'This can sometimes become heightened sensitivity to pressure or expectation, especially your own.',
      'Others may experience this expression as intense or hard to predict.',
    ],
    howToUse:
      "This can be useful to explore in any role that benefits from a genuinely different perspective, not just a conventional one. It may also help to pair an instinct with a concrete explanation, so others can follow the reasoning, not just the conclusion.",
  },
  22: {
    yourInterpretation:
      'Destiny 22 is traditionally considered a master number and is often associated with expressing yourself through turning an ambitious vision into something practically real. This can point toward abilities that show up when a role lets you combine large-scale thinking with the patience to build it properly. People with this number are often described as someone trusted with something bigger than usual.',
    showsUpAs: [
      'At work, this may show up as being given responsibility for a project with unusually high stakes or scale.',
      'In a leadership role, you may find yourself thinking in terms of years rather than weeks.',
      'In collaboration, this can be expressed through turning a shared ambition into an actual plan with real steps.',
    ],
    strengths: [
      'Your abilities may be particularly well expressed through holding both a big vision and the practical detail needed to realise it.',
      "You can be effective at sustaining effort on something that won't pay off for a long time.",
      'This pattern often supports communication that makes an ambitious goal sound genuinely achievable.',
    ],
    mindfulOf: [
      "When overextended, this quality can show up as taking on a scale of responsibility that's difficult to sustain alone.",
      'This can sometimes become impatience with smaller, less consequential work.',
      'Others may experience this expression as intimidating, simply because of the scale involved.',
    ],
    howToUse:
      "This can be useful to explore in any project genuinely large enough to need both vision and discipline. It may also help to build in smaller milestones, so progress feels real along the way rather than only at the end.",
  },
  33: {
    yourInterpretation:
      "Destiny 33 is traditionally considered a master number and is often associated with expressing yourself through care and service on a wider scale. This can point toward abilities that show up when a role lets you support people's wellbeing as a central part of the work, not a side effect of it. People with this number are often described as someone whose presence itself helps others.",
    showsUpAs: [
      'At work, this may show up as being the person colleagues go to when they need genuine support, not just advice.',
      "In a mentoring or teaching role, you may focus as much on how someone's doing as on what they're learning.",
      "In collaboration, this can be expressed through quietly making sure the group's wellbeing is looked after, not just its output.",
    ],
    strengths: [
      "Your abilities may be particularly well expressed through roles centred on supporting other people's growth.",
      'You can be effective at creating genuine trust and safety in a group.',
      "This pattern often supports deeply reassuring communication, especially with people going through something hard.",
    ],
    mindfulOf: [
      "When overextended, this quality can show up as carrying other people's wellbeing as though it were entirely your responsibility.",
      "This can sometimes become difficulty separating your own needs from the people you're supporting.",
      'Others may experience this expression as a lot to live up to, simply by comparison.',
    ],
    howToUse:
      "This can be useful to explore in any role genuinely built around supporting others' growth or wellbeing. It may also help to set clear limits on how much you take on, so this capacity for care stays sustainable for you too.",
  },
};

function buildDestinySection(value: number): CoreNumberSection {
  const entry = DESTINY_CONTENT[knownDigitFor(value)] ?? DESTINY_CONTENT[9];
  return { represents: DESTINY_REPRESENTS, ...entry };
}

// ---------------------------------------------------------------------------
// Soul Urge - bespoke, inner-motivation-focused content per value (1-9, 11,
// 22, 33), in the same structured shape and plain-English voice as
// `LIFE_PATH_CONTENT`, `PERSONALITY_CONTENT` and `DESTINY_CONTENT` above.
// Every field here is framed around inner motivation, personal values, and
// what may feel meaningful or fulfilling (Soul Urge's traditional meaning) -
// distinct from Life Path's broad direction, Personality's outward first
// impression, and Destiny's abilities/potential framing. Preserves the
// traditional theme already represented by each digit's entry in
// `SOUL_URGE_ARCHETYPES` (see `src/core/archetypes.ts`, left untouched and
// still used elsewhere), but written in reflective language rather than
// that table's "your soul yearns/craves" phrasing.
// ---------------------------------------------------------------------------

const SOUL_URGE_REPRESENTS =
  'Soul Urge is traditionally associated with inner motivation - what tends to feel meaningful, satisfying, or personally important on the inside, regardless of how it looks from the outside. It is calculated from the vowels in your full birth name.';

/** Same shape as `LifePathEntry` - Soul Urge's content is structured
 *  identically, just written through its own inner-motivation lens. */
type SoulUrgeEntry = LifePathEntry;

const SOUL_URGE_CONTENT: Record<number, SoulUrgeEntry> = {
  1: {
    yourInterpretation:
      "Soul Urge 1 is traditionally associated with an inner pull toward autonomy and originality. You may feel most satisfied when a choice, a project, or an idea is genuinely your own, rather than inherited from someone else's plan. People with this number are often described as motivated by a need to prove things to themselves first, before anyone else's approval matters.",
    showsUpAs: [
      'In personal choices, you may feel more fulfilled picking your own path, even if a more established option is available.',
      'In work preferences, you may feel most engaged when you have real ownership over how a task gets done, not just what the end result should be.',
      "In free time, you might be drawn to an activity you can approach in your own way rather than following someone else's method.",
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as a genuine sense of initiative.',
      'This inner drive can support real confidence in your own judgement.',
      'It can also bring a quiet satisfaction in work you know is authentically yours.',
    ],
    mindfulOf: [
      "When this preference becomes too strong, it can make shared decision-making feel more effortful than it needs to be.",
      "You may want to watch for dismissing a good idea simply because it wasn't yours originally.",
      "Others may not always see the importance you place on doing something your own way.",
    ],
    howToUse:
      "It may help to notice the moments when 'doing it your way' genuinely serves the outcome, and the moments where it mainly serves your sense of ownership. Being aware of that difference can make it easier to decide when to lead and when collaborating might actually feel just as satisfying.",
  },
  2: {
    yourInterpretation:
      'Soul Urge 2 is traditionally associated with an inner pull toward closeness and emotional safety. You may feel most fulfilled in a relationship or setting where trust has been quietly built over time, rather than one that moves quickly. People with this number are often described as motivated by a need for genuine, gentle connection more than attention or achievement.',
    showsUpAs: [
      'In relationships, you may feel most content with a smaller circle of people you trust deeply, rather than a wide network of acquaintances.',
      'In communication, you might prefer a calm, one-on-one conversation over a larger group discussion.',
      'In work preferences, you may feel more motivated in a cooperative environment than a competitive one.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as real patience in building trust with others.',
      'This inner drive can support a genuinely steady, reassuring presence for people close to you.',
      'It can also bring a quiet attentiveness to how others are feeling.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make conflict feel more threatening than it actually is.',
      'You may want to watch for going quiet about your own needs to avoid upsetting the harmony of a relationship.',
      'Others may not always see how much emotional safety matters to you, if you tend to keep that need private.',
    ],
    howToUse:
      'It may help to notice the relationships and settings where you feel most at ease, and consider what specifically makes them feel safe. Naming that to yourself can make it easier to communicate what you need, rather than hoping others will simply sense it.',
  },
  3: {
    yourInterpretation:
      'Soul Urge 3 is traditionally associated with an inner pull toward creativity and shared joy. You may feel most fulfilled when you have an outlet for self-expression, and when that expression is genuinely shared with other people. People with this number are often described as motivated less by outcomes and more by the feeling of creating and connecting itself.',
    showsUpAs: [
      "In free time, you may be drawn toward a creative outlet - writing, music, conversation, or anything that lets an idea or feeling take shape.",
      "In relationships, you might feel most connected to people when there's room for genuine laughter or playfulness.",
      "In work preferences, you may feel more motivated by a role that lets you express an idea in your own voice, rather than one that's entirely routine.",
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as a genuinely infectious enthusiasm.',
      'This inner drive can support real warmth in how you connect with people.',
      'It can also bring a willingness to keep creating even without knowing how it will turn out.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make a quieter, more serious moment feel uncomfortable to sit with.',
      'You may want to watch for chasing the next creative spark before finishing the current one.',
      "Others may not always see how much this need for expression matters, if it looks like \"just having fun\" from the outside.",
    ],
    howToUse:
      "It may help to notice whether a role, relationship, or routine actually gives you room to express yourself, or just keeps you busy. Being honest with yourself about that difference can make it easier to choose where to put your energy.",
  },
  4: {
    yourInterpretation:
      "Soul Urge 4 is traditionally associated with an inner pull toward order and dependable stability. You may feel most satisfied when you know what's expected, what the plan is, and that the people and structures around you are reliable. People with this number are often described as motivated by a need for solid ground more than excitement or acclaim.",
    showsUpAs: [
      "In personal choices, you may feel more at ease picking the option that's proven and consistent over the one that's merely exciting.",
      'In work preferences, you may feel more satisfied when you know what needs to be done and can work through it in a clear, orderly way.',
      "In relationships, you might value a partner or friend who follows through on what they say, more than one who's simply exciting to be around.",
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuine follow-through on commitments.',
      "This inner drive can support a real sense of calm under pressure, because you've usually prepared for it.",
      'It can also bring steady reliability that people around you come to depend on.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make an unplanned change feel more unsettling than it needs to be.',
      "You may want to watch for holding onto a routine past the point it's still serving you.",
      'Others may not always see how much effort goes into maintaining the order you rely on.',
    ],
    howToUse:
      "It may help to notice which parts of your routine genuinely support you, and which ones have simply become habit. Keeping that distinction in mind can make it easier to stay open to a change that's actually worth making.",
  },
  5: {
    yourInterpretation:
      'Soul Urge 5 is traditionally associated with an inner pull toward freedom and variety. You may feel most fulfilled when a day, a role, or a relationship leaves genuine room to shift direction. People with this number are often described as motivated by the experience of something new more than by security or routine.',
    showsUpAs: [
      "In free time, you may be drawn toward trying something you haven't done before, rather than returning to the same activity.",
      "In work preferences, you might feel more engaged in a role that varies from day to day than one that's highly repetitive.",
      'In relationships, you may value a connection that leaves you room to pursue your own interests independently.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as a genuine openness to new experiences.',
      'This inner drive can support real adaptability when circumstances shift unexpectedly.',
      'It can also bring an infectious sense of curiosity to people around you.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make it harder to commit to something for the time it actually needs.',
      'You may want to watch for mistaking restlessness for a genuine need to change direction.',
      "Others may not always see how much freedom matters to you, especially in a relationship that otherwise feels secure.",
    ],
    howToUse:
      "It may help to notice whether a desire for change is pointing you toward something genuinely new, or is more about discomfort with the current moment. Checking in with that distinction can make it easier to decide what's actually worth pursuing.",
  },
  6: {
    yourInterpretation:
      "Soul Urge 6 is traditionally associated with an inner pull toward care and harmony within close relationships. You may feel most fulfilled when the people you're responsible for, or close to, are doing well and feel genuinely looked after. People with this number are often described as motivated by a need to create warmth and stability for the people who matter most to them.",
    showsUpAs: [
      'In relationships, you may feel most satisfied when you can contribute directly to someone else\'s comfort or wellbeing.',
      'In responsibility, you might naturally take on a caretaking role within a family, friend group, or team.',
      'In personal choices, you may weigh how an option affects people close to you as much as how it affects you.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuine warmth that others feel is sincere.',
      'This inner drive can support real dependability in a close relationship.',
      'It can also bring a talent for noticing what a space or situation needs to feel more settled.',
    ],
    mindfulOf: [
      "When this preference becomes too strong, it can make it hard to let someone else handle their own responsibilities.",
      'You may want to watch for measuring your own wellbeing mainly by how well you\'re caring for others.',
      'Others may not always see how much you need to feel needed, since it can look like simple generosity from the outside.',
    ],
    howToUse:
      'It may help to notice when caring for others is something you genuinely want to do, versus something you feel obligated to do. Being aware of that difference can make it easier to offer care sustainably, rather than at your own expense.',
  },
  7: {
    yourInterpretation:
      'Soul Urge 7 is traditionally associated with an inner pull toward solitude and understanding. You may feel most fulfilled when you have uninterrupted time to think something through, without needing to explain yourself along the way. People with this number are often described as motivated by a need to understand something fully, more than to be seen as understanding it.',
    showsUpAs: [
      'In free time, you may be drawn toward quiet, solitary activities that let you think without interruption.',
      'In learning, you might prefer to go deep into one subject rather than cover many topics briefly.',
      'In relationships, you may value a connection where silence is comfortable, rather than one that needs constant conversation.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuinely thorough, considered thinking.',
      'This inner drive can support real comfort with being alone, without it feeling lonely.',
      'It can also bring an ability to notice something meaningful that a quicker glance would miss.',
    ],
    mindfulOf: [
      "When this preference becomes too strong, it can make it harder to let other people into your process before you feel ready.",
      'You may want to watch for withdrawing when what would actually help is talking it through with someone.',
      'Others may not always see how much you value this quiet time, since it can look like distance rather than reflection.',
    ],
    howToUse:
      'It may help to notice when quiet reflection is genuinely helping you understand something, and when it\'s mainly a way of avoiding a conversation that needs to happen. Being aware of that difference can make solitude more useful rather than isolating.',
  },
  8: {
    yourInterpretation:
      'Soul Urge 8 is traditionally associated with an inner pull toward recognition for genuine capability. You may feel most fulfilled when your own competence and effort are the reason something has gone well, and when that is visibly acknowledged. People with this number are often described as motivated by a sense of personal authority that comes from what they have actually achieved.',
    showsUpAs: [
      'In goals, you may feel most satisfied setting a target you can point to and say you accomplished it through your own effort.',
      'In work preferences, you might feel more motivated in a role where your contribution is clearly attributable to you.',
      'In personal choices, you may weigh how an option affects your sense of independence and standing.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuine drive toward a goal that matters to you.',
      "This inner drive can support real confidence when you've actually put in the work.",
      'It can also bring a practical focus on turning effort into a visible result.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make it harder to share credit for something you contributed to.',
      'You may want to watch for measuring your own worth mainly through achievement or recognition.',
      'Others may not always see how much this need for acknowledgement matters, if you keep it to yourself.',
    ],
    howToUse:
      "It may help to notice whether a goal is meaningful to you specifically, or mainly valuable because of how it will look to others. Being honest about that difference can make it easier to choose goals that feel genuinely satisfying, not just impressive.",
  },
  9: {
    yourInterpretation:
      'Soul Urge 9 is traditionally associated with an inner pull toward compassion and contribution beyond yourself. You may feel most fulfilled when your effort has made things a little easier or kinder for people you may never meet personally. People with this number are often described as motivated less by personal gain and more by a sense that their presence made things better.',
    showsUpAs: [
      'In helping others, you may feel most satisfied contributing to a cause larger than your own immediate circle.',
      "In work preferences, you might feel more motivated in a role with a clear positive impact, even if it isn't the highest paid.",
      'In relationships, you may be drawn to people who are going through something difficult, wanting to offer support.',
    ],
    strengths: [
      "When this motivation is aligned with your actions, it can show up as genuine compassion that doesn't need to be asked for.",
      "This inner drive can support a real willingness to let go of something once its purpose has been served.",
      'It can also bring a wider perspective that helps you see past your own immediate stake in a situation.',
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make it harder to say no to one more request for help.',
      'You may want to watch for giving so much that little is left for your own needs.',
      "Others may not always see how deeply you take on a cause or a person's wellbeing as your own concern.",
    ],
    howToUse:
      "It may help to notice when giving to others is genuinely sustainable, and when it's starting to come at your own expense. Being aware of that line can make it easier to help in a way you can actually keep up.",
  },
  11: {
    yourInterpretation:
      "Soul Urge 11 is traditionally considered a master number and is often associated with an inner pull toward meaning and insight that goes beyond the everyday. You may feel most fulfilled when a choice, a conversation, or a moment feels genuinely significant, not just convenient. People with this number are often described as motivated by a wish to feel aligned with something they sense but can't always fully explain.",
    showsUpAs: [
      'In personal choices, you may be drawn toward an option that feels right on instinct, even before you can justify it logically.',
      'In relationships, you might feel most fulfilled in a connection that includes a sense of genuine understanding, not just shared activities.',
      'In learning, you may be drawn toward subjects that touch on meaning or deeper questions rather than purely practical skills.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as a genuine sensitivity to what a situation actually needs.',
      "This inner drive can support an ability to sense a shift in mood or direction before it's obvious to others.",
      "It can also bring real encouragement to people around you, simply through your own sense of conviction.",
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make an ordinary, practical task feel unsatisfying by comparison.',
      "You may want to watch for feeling pressure to live up to a sense that you're meant for something unusually significant.",
      "Others may not always see the importance you place on a feeling you can't fully put into words.",
    ],
    howToUse:
      'It may help to notice the moments that genuinely feel meaningful to you, and consider what specifically gives them that quality. Naming it, even privately, can make this kind of motivation easier to act on with confidence rather than second-guessing it.',
  },
  22: {
    yourInterpretation:
      'Soul Urge 22 is traditionally considered a master number and is often associated with an inner pull toward building something lasting on a large scale. You may feel most fulfilled when your effort is contributing to something that will genuinely outlast the moment it was made in. People with this number are often described as motivated less by a quick win and more by a sense of lasting contribution.',
    showsUpAs: [
      'In goals, you may feel most satisfied working toward something ambitious enough to take years, rather than something quick.',
      "In work preferences, you might feel more motivated by a project with real, tangible impact than one that's purely short-term.",
      'In responsibility, you may be drawn to take on something larger than what\'s typically expected, if you believe in its purpose.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuine patience for a long-term undertaking.',
      'This inner drive can support the rare combination of practical follow-through alongside a big-picture sense of purpose.',
      "It can also bring real steadiness when a project's scale might otherwise feel overwhelming.",
    ],
    mindfulOf: [
      'When this preference becomes too strong, it can make a smaller, everyday task feel unsatisfying by comparison.',
      "You may want to watch for taking on a scale of responsibility that's difficult to sustain by yourself.",
      'Others may not always see the significance you place on a project that, to them, looks ordinary.',
    ],
    howToUse:
      "It may help to notice whether a long-term goal still feels meaningful day to day, not just as a distant destination. Checking in with that regularly can make a large undertaking feel sustainable rather than only worthwhile once it's finished.",
  },
  33: {
    yourInterpretation:
      'Soul Urge 33 is traditionally considered a master number and is often associated with an inner pull toward caring for others on a wide scale. You may feel most fulfilled when you can offer genuine support to people, particularly those who are struggling or vulnerable. People with this number are often described as motivated by a need to make things gentler for the people around them.',
    showsUpAs: [
      "In helping others, you may feel most satisfied in a role centred on other people's wellbeing, not just a task.",
      'In relationships, you might be the one who ends up supporting whoever in the group needs it most.',
      'In free time, you may be drawn to an activity or cause connected to caring for people beyond your immediate circle.',
    ],
    strengths: [
      'When this motivation is aligned with your actions, it can show up as genuinely deep empathy that others can feel is real.',
      'This inner drive can support a real capacity to create safety for people who are going through something hard.',
      "It can also bring patience that doesn't run out quickly, even with someone who needs a lot of support.",
    ],
    mindfulOf: [
      "When this preference becomes too strong, it can make it harder to notice your own needs amid everyone else's.",
      'You may want to watch for carrying other people\'s emotional weight longer than is good for you.',
      'Others may not always see how much this capacity for care costs you personally, since it looks effortless from the outside.',
    ],
    howToUse:
      'It may help to notice when supporting others still leaves you with something left over for yourself. Being aware of that balance can make this kind of care sustainable rather than something that quietly depletes you.',
  },
};

function buildSoulUrgeSection(value: number): CoreNumberSection {
  const entry = SOUL_URGE_CONTENT[knownDigitFor(value)] ?? SOUL_URGE_CONTENT[9];
  return { represents: SOUL_URGE_REPRESENTS, ...entry };
}

/**
 * Builds the full structured interpretation for one Core Number card.
 * `value` is whatever `buildNumerologyReport()` already calculated for that
 * category (e.g. `report.lifePath`) - this never recalculates it.
 */
export function getCoreNumberInterpretation(key: CoreNumberKey, value: number): CoreNumberSection {
  if (key === 'lifePath') {
    return buildLifePathSection(value);
  }
  if (key === 'personality') {
    return buildPersonalitySection(value);
  }
  if (key === 'destiny') {
    return buildDestinySection(value);
  }
  if (key === 'soulUrge') {
    return buildSoulUrgeSection(value);
  }

  const framing = CATEGORY_FRAMING[key];
  const essence = essenceFor(value);

  return {
    represents: framing.represents,
    yourInterpretation: yourInterpretationFor(key, value),
    showsUpAs: essence.themes.map(framing.showUp),
    strengths: essence.strengths.map(framing.strength),
    mindfulOf: essence.mindfulOf.map(framing.mindful),
    howToUse: framing.howToUse(essence),
  };
}

// ---------------------------------------------------------------------------
// "Your Personal Core Summary" - a genuine synthesis of the five Core
// Numbers, answering "what do these five parts suggest when I look at them
// together?" (the individual cards above already answer "what does each
// part suggest on its own?"). Unlike the cards, this draws on a small,
// summary-specific theme phrase per category/value (`*_SUMMARY_THEME` below)
// derived from each category's already-approved bespoke content - never the
// full `yourInterpretation` text (that would just duplicate the cards), and
// no longer the generic `NUMBER_ESSENCE` keyword this used before. Synthesis
// is intentionally modest: a repeated underlying digit across categories, and
// the presence of a master number, are the only cross-number signals called
// out, since both are objectively checkable from the already-calculated
// report - nothing here invents a new numerology theory or a conflict/
// compatibility system.
// ---------------------------------------------------------------------------

export interface CoreNumberSummary {
  /** A short paragraph synthesizing all five Core Numbers together. */
  paragraph: string;
  /** 1-3 overarching themes, deduplicated across the five numbers. */
  overarchingThemes: string[];
}

const SUMMARY_LABELS: Record<CoreNumberKey, string> = {
  lifePath: 'Life Path',
  destiny: 'Destiny',
  soulUrge: 'Soul Urge',
  personality: 'Personality',
  birthday: 'Birthday',
};

/** Order used throughout the summary builder below - fixed so output stays deterministic. */
const SUMMARY_ORDER: CoreNumberKey[] = ['lifePath', 'destiny', 'soulUrge', 'personality', 'birthday'];

/**
 * Short, synthesis-oriented theme phrases per category/value - distinct from
 * (and much shorter than) each category's full `*_CONTENT` entry, and based
 * on that same already-approved meaning rather than a rewrite of it. These
 * exist only to build the summary paragraph/themes; the full bespoke content
 * above remains the single source of truth for the individual cards.
 */
const LIFE_PATH_SUMMARY_THEME: Record<number, string> = {
  1: 'independence and taking the lead',
  2: 'cooperation and sensitivity to others',
  3: 'self-expression and creativity',
  4: 'practicality and steady, step-by-step building',
  5: 'variety and adapting easily to change',
  6: 'care and responsibility for the people close to you',
  7: 'reflection and a deeper search for understanding',
  8: 'ambition and practical results',
  9: 'compassion and a wider view of life',
  11: 'heightened intuition and inspiring others',
  22: 'turning a big vision into something real and lasting',
  33: 'deep compassion and helping others on a larger scale',
};

const DESTINY_SUMMARY_THEME: Record<number, string> = {
  1: 'self-direction and original thinking',
  2: 'bringing people and perspectives into alignment',
  3: 'creativity and putting ideas into words',
  4: 'building durable, dependable systems',
  5: 'flexibility and guiding people through a transition',
  6: 'care and a sense of duty toward others',
  7: 'careful reasoning and depth of understanding',
  8: 'practical ambition and the responsible use of resources',
  9: 'a wider sense of contribution, beyond your immediate circle',
  11: 'insight that bridges intuition and practical impact',
  22: 'turning an ambitious vision into something practically real',
  33: 'care and service expressed on a wider scale',
};

const SOUL_URGE_SUMMARY_THEME: Record<number, string> = {
  1: 'autonomy and originality',
  2: 'closeness and emotional safety',
  3: 'creativity and shared joy',
  4: 'order and dependable stability',
  5: 'freedom and variety',
  6: 'care and harmony within close relationships',
  7: 'solitude and understanding',
  8: 'recognition for genuine capability',
  9: 'compassion and contribution beyond yourself',
  11: 'meaning and insight that goes beyond the everyday',
  22: 'building something lasting on a large scale',
  33: 'caring for others on a wide scale',
};

const PERSONALITY_SUMMARY_THEME: Record<number, string> = {
  1: 'direct and self-assured',
  2: 'gentle and approachable',
  3: 'expressive and easy to warm to',
  4: 'grounded and dependable',
  5: 'energetic and open',
  6: 'warm and attentive',
  7: 'thoughtful and a little reserved',
  8: 'confident and capable',
  9: 'broad-minded and easy to approach',
  11: 'intuitive and quietly striking',
  22: 'both capable and visionary',
  33: 'warm and quietly devoted',
};

/** Life Path, Destiny, Soul Urge and Personality each have their own short
 *  theme table above; Birthday deliberately reuses `BIRTHDAY_THEMES`
 *  directly (see `summaryThemeFor`) rather than duplicating it here. */
const CORE_NUMBER_SUMMARY_THEMES: Record<Exclude<CoreNumberKey, 'birthday'>, Record<number, string>> = {
  lifePath: LIFE_PATH_SUMMARY_THEME,
  destiny: DESTINY_SUMMARY_THEME,
  soulUrge: SOUL_URGE_SUMMARY_THEME,
  personality: PERSONALITY_SUMMARY_THEME,
};

/**
 * Resolves the short summary theme phrase for one category/value, using the
 * same `knownDigitFor()` resolution every other category already uses (so a
 * compound Birthday like 25 is still read via its traditional reduction to
 * 7, exactly as the Birthday card already does - never as a raw 25).
 *
 * Exported so other content-layer modules (e.g. Forecast's Blueprint-context
 * personalization) can reuse this exact short phrase instead of introducing
 * a second digit -> meaning table of their own.
 */
export function summaryThemeFor(key: CoreNumberKey, value: number): string {
  const digit = knownDigitFor(value);
  if (key === 'birthday') {
    return BIRTHDAY_THEMES[digit] ?? BIRTHDAY_THEMES[9];
  }
  const table = CORE_NUMBER_SUMMARY_THEMES[key];
  return table[digit] ?? table[9];
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function getCoreNumberSummary(report: NumerologyReport): CoreNumberSummary {
  const values: Record<CoreNumberKey, number> = {
    lifePath: report.lifePath,
    destiny: report.destiny,
    soulUrge: report.soulUrge,
    personality: report.personality,
    birthday: report.birthday,
  };

  const digitByKey = SUMMARY_ORDER.reduce(
    (acc, key) => {
      acc[key] = knownDigitFor(values[key]);
      return acc;
    },
    {} as Record<CoreNumberKey, number>,
  );

  const themeByKey = SUMMARY_ORDER.reduce(
    (acc, key) => {
      acc[key] = summaryThemeFor(key, values[key]);
      return acc;
    },
    {} as Record<CoreNumberKey, string>,
  );

  // Group categories that share the same underlying digit - the only
  // "repeated number" signal this draws on, and purely objective (no new
  // numerology theory): e.g. Life Path and Destiny both resolving to 1.
  const keysByDigit = new Map<number, CoreNumberKey[]>();
  for (const key of SUMMARY_ORDER) {
    const digit = digitByKey[key];
    keysByDigit.set(digit, [...(keysByDigit.get(digit) ?? []), key]);
  }
  const repeatedGroups = Array.from(keysByDigit.entries()).filter(([, keys]) => keys.length >= 2);
  const masterKeys = SUMMARY_ORDER.filter((key) => [11, 22, 33].includes(digitByKey[key]));

  // Overarching themes: repeated digits first (the strongest recurring
  // signal), then the remaining distinct digits in category order, capped
  // at 3 - never a raw dedup of five independent keywords.
  const uniqueDigitsInOrder = SUMMARY_ORDER.map((key) => digitByKey[key]).filter(
    (digit, index, all) => all.indexOf(digit) === index,
  );
  const repeatedDigitSet = new Set(repeatedGroups.map(([digit]) => digit));
  const prioritizedDigits = [
    ...uniqueDigitsInOrder.filter((digit) => repeatedDigitSet.has(digit)),
    ...uniqueDigitsInOrder.filter((digit) => !repeatedDigitSet.has(digit)),
  ].slice(0, 3);
  const overarchingThemes = prioritizedDigits.map((digit) => {
    const key = SUMMARY_ORDER.find((candidate) => digitByKey[candidate] === digit) as CoreNumberKey;
    return themeByKey[key];
  });

  // Outer direction (Life Path) alongside inner motivation (Soul Urge).
  const sentenceA =
    `Looking at your Life Path and Soul Urge together, there is a traditional pull toward ${themeByKey.lifePath}, ` +
    `while a pull toward ${themeByKey.soulUrge} may be what feels personally meaningful beneath that broader direction.`;

  // Abilities/expression (Destiny) alongside outward impression (Personality).
  const sentenceB =
    `Your Destiny traditionally suggests ${themeByKey.destiny}, which can sit alongside your Personality, ` +
    `often described as coming across as ${themeByKey.personality}.`;

  // Birthday as the smaller, supporting layer it is already described as.
  const sentenceC = `As a smaller, everyday layer, your Birthday traditionally points to ${themeByKey.birthday}.`;

  const sentences = [sentenceA, sentenceB, sentenceC];

  if (repeatedGroups.length > 0) {
    const [digit, keysSharingDigit] = repeatedGroups[0];
    const theme = themeByKey[keysSharingDigit[0]];
    const labels = joinWithAnd(keysSharingDigit.map((key) => SUMMARY_LABELS[key]));
    sentences.push(
      `Number ${digit} appears in more than one part of your Core Numbers - in your ${labels} - ` +
        `so the traditional theme of ${theme} is echoed across different aspects of your profile.`,
    );
  }

  if (masterKeys.length > 0) {
    const labels = joinWithAnd(masterKeys.map((key) => SUMMARY_LABELS[key]));
    sentences.push(
      `Your profile also includes a master number in your ${labels}, which traditional numerology treats as ` +
        `a distinct interpretive layer rather than simply a stronger version of the reduced digit.`,
    );
  }

  sentences.push(
    'Taken together, these five numbers may be most useful as a set of traditional perspectives worth reflecting on, rather than a fixed description of who you are.',
  );

  return { paragraph: sentences.join(' '), overarchingThemes };
}
