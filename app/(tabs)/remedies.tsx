import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProfileStore } from '@/features/profile/store';
import { useEntitlement } from '@/features/entitlements';
import { LockOverlay } from '@/ui/components';
import { buildLoShuGrid } from '@/core/loShu';
import type { Digit } from '@/core/types';
import { useRitualStore, type PracticePart } from '@/features/remedies/ritualStore';
import { visibleAfternoonActivities } from '@/features/remedies/afternoonVisibility';
import { isDayFullyComplete, isSectionUnlocked } from '@/features/remedies/sectionGating';
import { selectedOptionLabel } from '@/features/remedies/selectedOptionLabel';
import { resolveActiveNumber, resolveActivePracticeDay, resolveJourneyPosition } from '@/services/questEngine';
import {
  PRACTICE_LIBRARY,
  bodyBreathReset,
  type PracticeActivity,
  type PracticeDay,
} from '@/data/practiceLibrary';

const SECTION_LABEL: Record<PracticePart, { title: string; subtitle: string }> = {
  morning: { title: '🌅 Morning', subtitle: 'Prepare & Set Direction' },
  afternoon: { title: '🌤️ Afternoon', subtitle: 'Focus & Explore' },
  night: { title: '🌙 Night', subtitle: 'Notice & Reflect' },
};

/** Per-section title accent color - sunrise amber for Morning, daylight gold
 *  for Afternoon, dusk lavender-purple for Night - applied only to the main
 *  section title text so Morning/Afternoon/Night read as visually distinct
 *  at a glance. Subtitle and body text keep the normal text colors. */
const SECTION_TITLE_COLOR: Record<PracticePart, string> = {
  morning: '#C2540C',
  afternoon: '#A8790A',
  night: '#6B4FA0',
};

/** The three successive 7-day Practice Journeys (Remedies Step 6/7) - purely
 *  display labels for the phase each journey represents. `cycleDay` itself
 *  stays the single source of truth; this is never persisted. */
const JOURNEY_PHASE: Record<1 | 2 | 3, string> = {
  1: 'Foundation',
  2: 'Exploration',
  3: 'Integration',
};
const JOURNEY_LIST = [1, 2, 3] as const;

/** The per-section background/glow pairing for the Morning (sunrise) /
 *  Afternoon (daylight) / Night (dusk) atmosphere - plain `StyleSheet` tints
 *  plus one translucent decorative shape, no gradient library and no image
 *  assets. Declared as a function (not a module-level map) purely so it can
 *  reference `styles`, which is defined later in this file - the same
 *  pattern already used by `renderActivityGuide`/`ActivityView` below. */
function getSectionAtmosphere(part: PracticePart): { card: object; glow: object } {
  switch (part) {
    case 'morning':
      return { card: styles.sectionCardMorning, glow: styles.sectionGlowMorning };
    case 'afternoon':
      return { card: styles.sectionCardAfternoon, glow: styles.sectionGlowAfternoon };
    case 'night':
      return { card: styles.sectionCardNight, glow: styles.sectionGlowNight };
  }
}

/** A simple 7-dot row for the current 7-day Journey: filled for days already
 *  behind `journeyDay` (truthfully complete - `cycleDay`/`journeyDay` only
 *  ever advances once a day has been fully completed, so every day before
 *  the current one is genuinely done), a distinct marker for the current
 *  day (in progress, not yet complete), and plain circles for the days still
 *  ahead. No invented per-day history - only what's already truthfully
 *  derivable from `cycleDay`. */
function JourneyDots({ journeyDay }: { journeyDay: number }) {
  return (
    <View style={styles.journeyDotsRow}>
      {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
        const isDone = day < journeyDay;
        const isCurrent = day === journeyDay;
        return (
          <Text key={day} style={isDone ? styles.journeyDotDone : isCurrent ? styles.journeyDotCurrent : styles.journeyDotUpcoming}>
            {isDone ? '●' : isCurrent ? '◉' : '○'}
          </Text>
        );
      })}
    </View>
  );
}

/** Emoji shown beside each line of the Body & Breath Reset, in order - a
 *  pure display concern, not a change to the underlying `bodyBreathReset()`
 *  content (which stays plain-text lines separated by `\n`). */
const RESET_LINE_EMOJIS = ['📱', '🙆', '🤲', '🌬️', '✨'];

/** The ONE daily feedback interaction, shown once near the end of the day's
 *  experience (after Night) - not repeated after every small activity.
 *  Feedback only: selecting an option never calls `completeSection` and is
 *  never required to complete the day's practice. */
const DAILY_FEEDBACK_OPTIONS = [
  { id: 'enjoyed', emoji: '😊', label: 'I enjoyed it' },
  { id: 'interesting', emoji: '💡', label: 'It was interesting' },
  { id: 'thought', emoji: '🤔', label: 'It made me think' },
  { id: 'okay', emoji: '😐', label: 'It was okay' },
  { id: 'difficult', emoji: '😕', label: 'It was difficult' },
];

/** Shared, stateless rendering for the "Would you like to try a similar
 *  practice again?" Yes/No control - the existing `repeatPreferencePrompt`
 *  content already in the Practice Library (on Afternoon and Night),
 *  simply not being rendered until now. This is its own small interaction,
 *  separate from the "How was today's practice?" feedback above: selecting
 *  Yes or No is tracked in the caller's local state only (never
 *  `completeSection`, never the Ritual Store), with the chosen option
 *  visually distinguished exactly like the rest of this screen's tap
 *  controls. */
function renderRepeatPreference(
  prompt: string | undefined,
  choice: 'yes' | 'no' | null,
  onChoose: (value: 'yes' | 'no') => void,
) {
  if (!prompt) return null;
  return (
    <View style={styles.repeatBlock}>
      <Text style={styles.repeatPrompt}>🔁 {prompt}</Text>
      <Text style={styles.repeatExplainerText}>
        Your answer helps guide future practice suggestions. It won't add another practice today.
      </Text>
      <View style={styles.repeatButtonsRow}>
        <TouchableOpacity
          style={[styles.repeatButton, choice === 'yes' && styles.repeatButtonSelected]}
          onPress={() => {
            void Haptics.selectionAsync();
            onChoose('yes');
          }}
        >
          <Text style={[styles.repeatButtonText, choice === 'yes' && styles.repeatButtonTextSelected]}>
            {choice === 'yes' ? '✓ Yes' : 'Yes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.repeatButton, choice === 'no' && styles.repeatButtonSelected]}
          onPress={() => {
            void Haptics.selectionAsync();
            onChoose('no');
          }}
        >
          <Text style={[styles.repeatButtonText, choice === 'no' && styles.repeatButtonTextSelected]}>
            {choice === 'no' ? '✓ No' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Shared, stateless rendering for one activity's full guidance: why it
 *  matters, what to do, concrete examples, the activity's own interactive
 *  control, then a short closing reminder. Used for Morning's single
 *  activity and each Afternoon activity, so a first-time user never has to
 *  guess what an activity means or when they're finished. Night keeps its
 *  own simpler, calmer rendering - this guide is intentionally not used
 *  there. */
function renderActivityGuide(whyLabel: string, activity: PracticeActivity, engagement: Engagement) {
  return (
    <View style={styles.activityGuideBlock}>
      <Text style={styles.activityPrompt}>{activity.prompt}</Text>
      {activity.whyThisMatters && (
        <>
          <Text style={styles.guideLabel}>{whyLabel}</Text>
          <Text style={styles.guideText}>{activity.whyThisMatters}</Text>
        </>
      )}
      {activity.instructions && (
        <>
          <Text style={styles.guideLabel}>What to do</Text>
          <Text style={styles.guideText}>{activity.instructions}</Text>
        </>
      )}
      {activity.examples && activity.examples.length > 0 && (
        <>
          <Text style={styles.guideLabel}>Examples</Text>
          {activity.examples.map((example) => (
            <Text key={example} style={styles.guideExampleText}>
              - {example}
            </Text>
          ))}
        </>
      )}
      <ActivityView activity={activity} engagement={engagement} />
      {activity.todaysReminder && <Text style={styles.reminderText}>Today's reminder: {activity.todaysReminder}</Text>}
    </View>
  );
}

/** Transient, in-memory only - never persisted. A quick way to tell whether a
 *  given activity has been genuinely engaged with (not just viewed), used to
 *  decide when a section's one required action becomes available. */
function useEngagement() {
  const [engaged, setEngaged] = useState<Record<string, boolean>>({});
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});

  const markEngaged = (activityId: string) => setEngaged((prev) => ({ ...prev, [activityId]: true }));
  const isEngaged = (activityId: string) => Boolean(engaged[activityId]);
  const select = (activityId: string, value: string | string[]) => {
    setSelections((prev) => ({ ...prev, [activityId]: value }));
    markEngaged(activityId);
  };
  const selectionFor = (activityId: string) => selections[activityId];
  /** Clears all engagement/selections - called whenever the resolved
   *  PracticeDay changes, so a new day never inherits the previous day's
   *  "already engaged with" state, even on the rare chance two days reuse
   *  the same activity id. */
  const reset = () => {
    setEngaged({});
    setSelections({});
  };

  return { isEngaged, markEngaged, select, selectionFor, reset };
}

type Engagement = ReturnType<typeof useEngagement>;

/** Renders one activity according to its `type`, using a Level 1 (tap) / 2
 *  (do) / 3 (type-only-when-useful) interaction appropriate to that type.
 *  Deliberately a single switch, not a generic dynamic-form engine - each
 *  branch is a small, direct rendering of that one activity shape. */
function ActivityView({ activity, engagement }: { activity: PracticeActivity; engagement: Engagement }) {
  const engaged = engagement.isEngaged(activity.id);
  const selection = engagement.selectionFor(activity.id);

  const tapToEngage = (label: string) => (
    <TouchableOpacity
      style={[styles.tapButton, engaged && styles.tapButtonDone]}
      onPress={() => {
        void Haptics.selectionAsync();
        engagement.markEngaged(activity.id);
      }}
      disabled={engaged}
    >
      <Text style={[styles.tapButtonText, engaged && styles.tapButtonTextDone]}>
        {engaged ? `✓ ${label}` : label}
      </Text>
    </TouchableOpacity>
  );

  const optionButtons = (
    options: { id: string; label: string }[],
    correctOptionId: string | undefined,
    multi: boolean,
  ) => (
    <View style={styles.optionsWrap}>
      {options.map((option) => {
        const isSelected = multi
          ? Array.isArray(selection) && selection.includes(option.id)
          : selection === option.id;
        const showCorrectHint = Boolean(selection) && correctOptionId === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
            onPress={() => {
              void Haptics.selectionAsync();
              if (multi) {
                const current = Array.isArray(selection) ? selection : [];
                const next = current.includes(option.id)
                  ? current.filter((id) => id !== option.id)
                  : [...current, option.id];
                engagement.select(activity.id, next);
              } else {
                engagement.select(activity.id, option.id);
              }
            }}
          >
            <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>
              {option.label}
              {showCorrectHint ? ' ✓' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  switch (activity.type) {
    case 'choice':
    case 'logic':
      return <View>{optionButtons(activity.options, activity.correctOptionId, false)}</View>;
    case 'multiChoice':
      return <View>{optionButtons(activity.options, undefined, true)}</View>;
    case 'scenario':
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.scenario}</Text>
          {optionButtons(activity.options, activity.correctOptionId, false)}
        </View>
      );
    case 'pattern':
      return (
        <View>
          <Text style={styles.patternRow}>{activity.sequence.join('  →  ')}  →  ?</Text>
          {optionButtons(activity.options, activity.correctOptionId, false)}
        </View>
      );
    case 'sequence': {
      const order = Array.isArray(selection) ? selection : [];
      const remaining = activity.items.filter((item) => !order.includes(item));
      return (
        <View>
          {order.length > 0 && (
            <Text style={styles.activitySupportText}>Your order: {order.map((item, i) => `${i + 1}. ${item}`).join('   ')}</Text>
          )}
          <View style={styles.optionsWrap}>
            {remaining.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionButton}
                onPress={() => {
                  void Haptics.selectionAsync();
                  engagement.select(activity.id, [...order, item]);
                }}
              >
                <Text style={styles.optionButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {remaining.length === 0 && <Text style={styles.activitySupportText}>✓ All placed.</Text>}
        </View>
      );
    }
    case 'sort': {
      const assigned = (selection && typeof selection === 'object' ? selection : {}) as unknown as Record<string, string>;
      const unassigned = activity.items.filter((item) => !(item in (assigned || {})));
      return (
        <View>
          {unassigned.length > 0 && (
            <>
              <Text style={styles.activitySupportText}>{unassigned[0]}</Text>
              <View style={styles.optionsWrap}>
                {activity.categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.optionButton}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      const nextAssigned = { ...assigned, [unassigned[0]]: category };
                      engagement.select(activity.id, nextAssigned as unknown as string[]);
                    }}
                  >
                    <Text style={styles.optionButtonText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {unassigned.length === 0 && <Text style={styles.activitySupportText}>✓ All sorted.</Text>}
        </View>
      );
    }
    case 'memory': {
      const hidden = selection === 'hidden';
      return (
        <View>
          <Text style={styles.activitySupportText}>{hidden ? activity.items.map(() => '?').join('  ') : activity.items.join('  ')}</Text>
          <TouchableOpacity
            style={[styles.tapButton, engaged && styles.tapButtonDone]}
            onPress={() => {
              void Haptics.selectionAsync();
              engagement.select(activity.id, hidden ? 'shown' : 'hidden');
            }}
          >
            <Text style={[styles.tapButtonText, engaged && styles.tapButtonTextDone]}>
              {hidden ? 'Show them again' : "I've looked - hide them"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    case 'rating': {
      const values = Array.from({ length: activity.max - activity.min + 1 }, (_, i) => activity.min + i);
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.scaleLabel}</Text>
          <View style={styles.optionsWrap}>
            {values.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.ratingButton, selection === String(value) && styles.optionButtonSelected]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  engagement.select(activity.id, String(value));
                }}
              >
                <Text style={styles.optionButtonText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    case 'observation':
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.whatToNotice}</Text>
          {tapToEngage('I noticed it')}
        </View>
      );
    case 'creative':
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.whatToMake}</Text>
          {tapToEngage('I tried this')}
        </View>
      );
    case 'realWorldAction':
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.whatToDo}</Text>
          {tapToEngage('I did this')}
        </View>
      );
    case 'reflection':
      return (
        <View>
          <Text style={styles.activitySupportText}>{activity.reflectionPrompt}</Text>
          {tapToEngage("I've reflected on this")}
        </View>
      );
    default:
      return null;
  }
}

function isActivityEngaged(activity: PracticeActivity, engagement: Engagement): boolean {
  if (engagement.isEngaged(activity.id)) return true;
  const selection = engagement.selectionFor(activity.id);
  if (activity.type === 'sequence') {
    return Array.isArray(selection) && selection.length === activity.items.length;
  }
  if (activity.type === 'sort') {
    const assigned = (selection && typeof selection === 'object' ? selection : {}) as unknown as Record<string, string>;
    return activity.items.every((item) => item in (assigned || {}));
  }
  return engagement.isEngaged(activity.id);
}

export default function RemediesScreen() {
  const profile = useProfileStore((s: any) => s.profile);
  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);
  const loading = useEntitlement((s) => s.loading);

  const activeDob = profile?.dob || profile?.birthDate || '1995-02-18';
  const loShu = buildLoShuGrid(activeDob);
  const presentDigits = Object.keys(loShu.counts || {}).map(Number).filter((d) => (loShu.counts as any)[d] > 0);
  const missingNumbers = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).filter((d) => !presentDigits.includes(d));

  const cycleDay = useRitualStore((s) => s.cycleDay);
  const completedParts = useRitualStore((s) => s.completedParts);
  const completedCycleNumbers = useRitualStore((s) => s.completedCycleNumbers);
  const streakDays = useRitualStore((s) => s.streakDays);
  const completeSection = useRitualStore((s) => s.completeSection);
  const advancePracticeDayIfComplete = useRitualStore((s) => s.advancePracticeDayIfComplete);

  const [selectedTab, setSelectedTab] = useState<'today' | 'progress'>('today');
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  const morningEngagement = useEngagement();
  const afternoonEngagement = useEngagement();
  const nightEngagement = useEngagement();

  // Local-only, transient: which of Morning/Afternoon/Night is expanded,
  // in the same collapsed-by-default accordion style as the SWOT audit
  // screen. Independent per section - opening one never opens or closes
  // another, and completing a section never auto-expands/collapses
  // anything. Not persisted; reset to all-collapsed below whenever
  // `practiceDay.id` changes (a fresh day starts fully collapsed).
  const [expanded, setExpanded] = useState<Record<PracticePart, boolean>>({
    morning: false,
    afternoon: false,
    night: false,
  });
  const toggleSection = (part: PracticePart) => {
    void Haptics.selectionAsync();
    setExpanded((prev) => ({ ...prev, [part]: !prev[part] }));
  };

  // Local-only, transient: independent expand/collapse for Morning's three
  // required sub-parts (Color Cue, Body & Breath Reset, Today's Focus),
  // nested inside the Morning accordion in the same style. Opening one
  // never opens or closes another. Not persisted; reset to all-collapsed
  // below whenever `practiceDay.id` changes.
  const [morningSubExpanded, setMorningSubExpanded] = useState({
    colorCue: false,
    bodyBreath: false,
    todaysFocus: false,
  });
  const toggleMorningSub = (key: 'colorCue' | 'bodyBreath' | 'todaysFocus') => {
    void Haptics.selectionAsync();
    setMorningSubExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local-only, transient: which PracticeDay the Body & Breath Reset (and,
  // below, the Color Cue) was last marked done for. Comparing against
  // today's `practiceDay.id` means each naturally reads as "not done" again
  // once the cycle day changes - no separate persistence, no Ritual Store
  // involvement, nothing to reset manually.
  const [resetDoneForDayId, setResetDoneForDayId] = useState<string | null>(null);
  const [colorCueDoneForDayId, setColorCueDoneForDayId] = useState<string | null>(null);

  // Local-only, transient: the daily feedback choices, asked once near
  // the end of the day's experience (after Night) rather than repeated
  // after every small activity. Multi-select - any combination of the
  // existing options may be selected at once, as a list of option ids.
  // Never persisted, never sent to the Ritual Store, never required to
  // complete the day's practice. Reset below whenever `practiceDay.id`
  // changes.
  const [dailyFeedback, setDailyFeedback] = useState<string[]>([]);
  // Local-only, transient: the separate "Would you like to try a similar
  // practice again?" Yes/No choice for Afternoon and Night. Distinct from
  // `dailyFeedback` above - this is its own small interaction, not the
  // overall day's feedback. Never persisted, never sent to the Ritual
  // Store, never a prerequisite for section completion.
  const [afternoonRepeat, setAfternoonRepeat] = useState<'yes' | 'no' | null>(null);
  const [nightRepeat, setNightRepeat] = useState<'yes' | 'no' | null>(null);
  // The 5-read Positive Affirmation interaction - local/transient only, never
  // persisted, and never a trigger for `completeSection`. Night's actual
  // completion continues to depend solely on the existing activity-readiness
  // mechanism below.
  const [affirmationReadCount, setAffirmationReadCount] = useState(0);
  // Local-only, session-level state for the "Carry Forward & Closing"
  // section, distinct from `dayFullyComplete` (which only controls whether
  // that section is *displayed*). Never persisted to the Ritual Store - the
  // store's progression model (`completedParts`/`cycleDay`) is untouched by
  // this flag. Reset below whenever `practiceDay.id` changes.
  const [closingComplete, setClosingComplete] = useState(false);
  // Local-only, transient: a separate preference from "whether you'd like to
  // try something like today's practice again" - distinct from `dailyFeedback`
  // (which only captures the five experience-feedback options above). A
  // simple on/off toggle, never persisted to the Ritual Store, never a
  // prerequisite for any completion. Reset below whenever `practiceDay.id`
  // changes.
  const [wantsSimilarAgain, setWantsSimilarAgain] = useState(false);

  const activeNumber = useMemo(
    () => resolveActiveNumber(missingNumbers, completedCycleNumbers),
    [missingNumbers, completedCycleNumbers],
  );
  const practiceDay: PracticeDay | null = useMemo(
    () => (activeNumber !== null ? resolveActivePracticeDay(PRACTICE_LIBRARY, activeNumber, cycleDay) : null),
    [activeNumber, cycleDay],
  );
  const journeyPosition = useMemo(() => resolveJourneyPosition(cycleDay), [cycleDay]);

  // The Afternoon activities actually shown today - on the handful of days
  // where Afternoon offers alternatives keyed to the Morning choice
  // (`requiresMorningOptionId`), this narrows the full list down to just the
  // one matching activity (or hides all of them until a Morning choice has
  // been made). Used identically by the render list below and by
  // `afternoonReady`, so what's displayed and what's required to complete
  // Afternoon can never drift apart.
  const visibleActivities = practiceDay
    ? visibleAfternoonActivities(
        practiceDay.afternoon.activities,
        morningEngagement.selectionFor(practiceDay.morning.activity.id),
      )
    : [];

  const celebrate = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCelebration(true);
  };

  // Starts the celebration animation only once `showCelebration` has
  // actually caused the Animated.View below to mount, rather than starting
  // it synchronously inside `celebrate()` (before React has committed that
  // render) - starting it too early risked racing the native driver's
  // attachment to a view that didn't exist in the native tree yet, which is
  // why the celebration could fail to appear on a physical device.
  useEffect(() => {
    if (!showCelebration) return;
    Animated.sequence([
      Animated.timing(celebrationAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2300),
      Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowCelebration(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCelebration]);

  const handleCompleteSection = (part: PracticePart) => {
    void Haptics.selectionAsync();
    void completeSection(part).then(() => {
      // Read the store directly rather than the stale render-time
      // `completedParts` closure, so this fires correctly regardless of
      // which of the three sections happens to be completed last.
      if (useRitualStore.getState().completedParts.length === 3) {
        // Deliberately does NOT celebrate or advance to the next day here
        // anymore - the celebration now represents completion of the whole
        // daily practice journey (including Carry Forward & Closing) and
        // fires from that section's own completion action instead (see the
        // "I've completed today's practice" button below). Advancing is
        // its own explicit action too, see `handleContinueToNextDay` below.
      }
    });
  };

  /**
   * The one explicit action that moves on to the next practice day, once
   * today's three sections are done. Available regardless of whether the
   * optional daily feedback was given - feedback stays entirely optional,
   * and the user is never trapped on a completed day because they didn't
   * want to answer it.
   */
  const handleContinueToNextDay = () => {
    void Haptics.selectionAsync();
    void advancePracticeDayIfComplete(missingNumbers);
  };

  const morningReady = practiceDay ? isActivityEngaged(practiceDay.morning.activity, morningEngagement) : false;
  const afternoonReady = practiceDay
    ? visibleActivities.length > 0 && visibleActivities.every((activity) => isActivityEngaged(activity, afternoonEngagement))
    : false;
  const nightActivityExists = Boolean(practiceDay?.night.activity);
  const nightReady = practiceDay && practiceDay.night.activity
    ? isActivityEngaged(practiceDay.night.activity, nightEngagement)
    : true;

  const morningDone = completedParts.includes('morning');
  const afternoonDone = completedParts.includes('afternoon');
  const nightDone = completedParts.includes('night');
  const dayFullyComplete = isDayFullyComplete(completedParts);

  // Sequential gating: Afternoon unlocks only once Morning is done, Night
  // only once Afternoon is done. Derived purely from `completedParts` (the
  // same signal `*Done` above already reads), so there is no second,
  // competing completion concept - just the existing state, read through
  // the one shared `isSectionUnlocked` rule used identically here and by
  // the auto-completion effects below.
  const afternoonUnlocked = isSectionUnlocked('afternoon', completedParts);
  const nightUnlocked = isSectionUnlocked('night', completedParts);

  // Reuses the exact Body & Breath Reset content already defined once in
  // the Practice Library (not duplicated here) as a recurring daily
  // supporting practice, separate from the three canonical sections.
  const resetActivity = practiceDay ? bodyBreathReset(`${practiceDay.id}-reset`) : null;
  const resetDone = practiceDay ? resetDoneForDayId === practiceDay.id : false;
  const colorCueDone = practiceDay ? colorCueDoneForDayId === practiceDay.id : false;
  // Today's Focus's own completion state, tracked separately from
  // `morningDone` (the Ritual Store flag). `morningReady` is already
  // day-scoped (it compares engagement against the current day's activity
  // id), so no additional local state is needed here - it's simply given
  // a clearer name for its new role as one of Morning's three sub-parts.
  const todaysFocusDone = morningReady;

  // Morning has three required sub-parts - Color Cue, Body & Breath Reset,
  // and Today's Focus - each with its own completion state. `morningDone`
  // (the Ritual Store flag) must only become true once all three are done;
  // see the effect below. Once it IS true (including after a reload, when
  // the local flags above have reset but the persisted completion has
  // not), Morning is shown as complete regardless of the individual flags,
  // so the display never contradicts the existing persisted state.
  const morningColorCueRequired = Boolean(practiceDay?.morning.colorCue);
  const morningResetRequired = Boolean(resetActivity);
  const morningTotalParts = 1 + (morningColorCueRequired ? 1 : 0) + (morningResetRequired ? 1 : 0);
  const morningCompletedParts =
    (todaysFocusDone ? 1 : 0) +
    (morningColorCueRequired && colorCueDone ? 1 : 0) +
    (morningResetRequired && resetDone ? 1 : 0);
  const morningSubPartsAllComplete =
    todaysFocusDone && (!morningColorCueRequired || colorCueDone) && (!morningResetRequired || resetDone);
  const morningAllPartsComplete = morningDone || morningSubPartsAllComplete;

  // The daily feedback choice and the affirmation read count are both
  // transient and tied to a specific day's content - reset them whenever
  // the resolved PracticeDay changes (new cycle day, or a new active
  // number), exactly as `resetDoneForDayId`/`colorCueDoneForDayId` already
  // do via their own id comparison above.
  useEffect(() => {
    setDailyFeedback([]);
    setAfternoonRepeat(null);
    setNightRepeat(null);
    setAffirmationReadCount(0);
    setClosingComplete(false);
    setWantsSimilarAgain(false);
    setExpanded({ morning: false, afternoon: false, night: false });
    setMorningSubExpanded({ colorCue: false, bodyBreath: false, todaysFocus: false });
    // A new PracticeDay must never show the previous day's "already engaged
    // with"/selected state - without this, a day transition (e.g. Night
    // completion advancing Day 1 -> Day 2) could leave a section looking
    // already completed on the newly displayed day.
    morningEngagement.reset();
    afternoonEngagement.reset();
    nightEngagement.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceDay?.id]);

  // Morning only calls the existing `completeSection('morning')` once all
  // three visible sub-parts - Color Cue, Body & Breath Reset, and Today's
  // Focus - are done. Today's Focus engagement alone is no longer enough:
  // previously `morningReady` (Today's Focus only) triggered this directly,
  // which let Morning (and potentially the whole day) be marked complete
  // while Color Cue/Body & Breath Reset were still untouched. Afternoon and
  // Night keep their original one-activity completion behavior below,
  // unchanged.
  useEffect(() => {
    if (morningSubPartsAllComplete && !morningDone) {
      handleCompleteSection('morning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morningSubPartsAllComplete, morningDone]);

  useEffect(() => {
    // Guarded by `afternoonUnlocked` (Morning must be done first) as well as
    // readiness - engagement with Afternoon's activities shouldn't be
    // possible while it's locked, but this keeps the completion rule itself
    // honest about the sequence too, not just the render.
    if (afternoonUnlocked && afternoonReady && !afternoonDone) {
      handleCompleteSection('afternoon');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afternoonUnlocked, afternoonReady, afternoonDone]);

  useEffect(() => {
    // Night has no activity on most days; readiness defaults to true then,
    // so this auto-complete only applies when there is a real activity to
    // engage with. The no-activity case keeps its own explicit single
    // button below (tapping it is the one genuine action available).
    // Guarded by `nightUnlocked` (Afternoon must be done first) for the same
    // reason as Afternoon's effect above.
    if (nightUnlocked && nightActivityExists && nightReady && !nightDone) {
      handleCompleteSection('night');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightUnlocked, nightActivityExists, nightReady, nightDone]);

  const todaysPractice = (
    <>
      <Text style={styles.philosophyText}>
        Your Fortune Enhancer Practice is inspired by the numbers in your personal numerology profile,
        especially the areas identified as needing more attention. Each day, take a little time to
        practise, explore, notice and reflect. The purpose isn't to guarantee fortune, but to help you
        consciously look for positive possibilities and take small actions toward them.
      </Text>

      {activeNumber === null ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Fortune Enhancer journey is complete 🎉</Text>
          <Text style={styles.bodyText}>
            You've worked through a 21-day practice for every number currently highlighted in your
            profile. Check Your Progress to see what you've completed.
          </Text>
        </View>
      ) : !practiceDay ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's practice isn't available right now</Text>
          <Text style={styles.bodyText}>Please check back again shortly.</Text>
        </View>
      ) : (
        <>
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyHeaderLabel}>🌿 Journey {journeyPosition.journeyNumber} of 3</Text>
            <Text style={styles.journeyHeaderDay}>Day {journeyPosition.journeyDay} of 7</Text>
            <Text style={styles.journeyPhaseText}>{JOURNEY_PHASE[journeyPosition.journeyNumber]}</Text>
            <JourneyDots journeyDay={journeyPosition.journeyDay} />
            <Text style={styles.journeyDotsCaption}>{journeyPosition.journeyDay - 1} of 7 days completed</Text>
          </View>

          <View style={styles.focusBadge}>
            <Text style={styles.focusBadgeText}>Today's Focus: Number {activeNumber}</Text>
          </View>
          <Text style={styles.focusExplanation}>
            Number {activeNumber} is one of the numbers currently highlighted in your profile as an
            area to explore. This practice offers a few small ways to reflect on it today.
          </Text>

          {/* MORNING - collapsed by default, like the SWOT audit accordion.
              Expanded order: Color Cue, Body & Breath Reset, Today's
              Focus, activity, completion. */}
          <View style={[styles.sectionCard, getSectionAtmosphere('morning').card]}>
            <View pointerEvents="none" style={[styles.sectionGlow, getSectionAtmosphere('morning').glow]} />
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              activeOpacity={0.7}
              onPress={() => toggleSection('morning')}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: SECTION_TITLE_COLOR.morning }]}>
                  {expanded.morning ? '▼' : '▶'} {SECTION_LABEL.morning.title}
                </Text>
                <Text style={styles.sectionSubtitle}>{SECTION_LABEL.morning.subtitle}</Text>
              </View>
              {morningAllPartsComplete ? (
                <Text style={styles.sectionDoneBadge}>✓ Morning practice complete</Text>
              ) : (
                <Text style={styles.sectionPendingBadge}>
                  {morningCompletedParts} of {morningTotalParts} complete
                </Text>
              )}
            </TouchableOpacity>

            {expanded.morning && (
            <>
            {practiceDay.morning.colorCue && (
              <View style={styles.colorCueBlock}>
                <TouchableOpacity
                  style={styles.subSectionHeaderRow}
                  activeOpacity={0.7}
                  onPress={() => toggleMorningSub('colorCue')}
                >
                  <Text style={styles.subheading}>
                    {morningSubExpanded.colorCue ? '▼' : '▶'} 🎨 Color Cue — {practiceDay.morning.colorCue.name}
                  </Text>
                  <Text style={colorCueDone ? styles.sectionDoneBadge : styles.sectionPendingBadge}>
                    {colorCueDone ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
                {morningSubExpanded.colorCue && (
                  <>
                    <Text style={styles.guideLabel}>Why this colour?</Text>
                    <Text style={styles.colorCueText}>{practiceDay.morning.colorCue.description}</Text>
                    {practiceDay.morning.colorCue.whatToDo && (
                      <>
                        <Text style={styles.guideLabel}>What to do</Text>
                        <Text style={styles.colorCueText}>{practiceDay.morning.colorCue.whatToDo}</Text>
                      </>
                    )}
                    {practiceDay.morning.colorCue.examples && practiceDay.morning.colorCue.examples.length > 0 && (
                      <>
                        <Text style={styles.guideLabel}>Examples</Text>
                        {practiceDay.morning.colorCue.examples.map((example) => (
                          <Text key={example} style={styles.guideExampleText}>
                            - {example}
                          </Text>
                        ))}
                      </>
                    )}
                    <TouchableOpacity
                      style={[styles.tapButton, colorCueDone && styles.tapButtonDone]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        if (!colorCueDone) setColorCueDoneForDayId(practiceDay.id);
                      }}
                      disabled={colorCueDone}
                    >
                      <Text style={[styles.tapButtonText, colorCueDone && styles.tapButtonTextDone]}>
                        {colorCueDone ? "✓ I've chosen my color cue" : "I've chosen my color cue"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {resetActivity && (
              <View style={styles.resetCard}>
                <TouchableOpacity
                  style={styles.subSectionHeaderRow}
                  activeOpacity={0.7}
                  onPress={() => toggleMorningSub('bodyBreath')}
                >
                  <Text style={styles.subheading}>
                    {morningSubExpanded.bodyBreath ? '▼' : '▶'} 🌿 Body & Breath Reset
                  </Text>
                  <Text style={resetDone ? styles.sectionDoneBadge : styles.sectionPendingBadge}>
                    {resetDone ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
                {morningSubExpanded.bodyBreath && (
                  <>
                    <Text style={styles.resetBodyText}>{resetActivity.prompt}</Text>
                    {'whatToDo' in resetActivity &&
                      resetActivity.whatToDo.split('\n').map((line, index) => (
                        <Text key={line} style={styles.resetBodyText}>
                          - {RESET_LINE_EMOJIS[index] ?? ''} {line}
                        </Text>
                      ))}
                    <TouchableOpacity
                      style={[styles.resetButton, resetDone && styles.resetButtonDone]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        if (!resetDone) setResetDoneForDayId(practiceDay.id);
                      }}
                      disabled={resetDone}
                    >
                      <Text style={[styles.resetButtonText, resetDone && styles.resetButtonTextDone]}>
                        {resetDone ? '✓ Reset complete' : "Done — I took a moment to reset"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <View style={styles.colorCueBlock}>
              <TouchableOpacity
                style={styles.subSectionHeaderRow}
                activeOpacity={0.7}
                onPress={() => toggleMorningSub('todaysFocus')}
              >
                <Text style={styles.subheading}>
                  {morningSubExpanded.todaysFocus ? '▼' : '▶'} 🎯 Today's Focus
                </Text>
                <Text style={todaysFocusDone ? styles.sectionDoneBadge : styles.sectionPendingBadge}>
                  {todaysFocusDone ? '✓' : '○'}
                </Text>
              </TouchableOpacity>
              {morningSubExpanded.todaysFocus && (
                <>
                  <Text style={styles.focusText}>{practiceDay.morning.focus}</Text>
                  {!todaysFocusDone ? (
                    renderActivityGuide("Why today's practice?", practiceDay.morning.activity, morningEngagement)
                  ) : (
                    <View style={[styles.tapButton, styles.tapButtonDone]}>
                      <Text style={[styles.tapButtonText, styles.tapButtonTextDone]}>
                        Your choice:{' '}
                        {selectedOptionLabel(
                          practiceDay.morning.activity,
                          morningEngagement.selectionFor(practiceDay.morning.activity.id),
                        ) ?? 'Selected'}{' '}
                        ✓
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
            </>
            )}
          </View>

          {/* AFTERNOON - introduction, fully-guided activities (why it
              matters, what to do, examples), the separate Yes/No repeat-
              preference, completion. The overall "How was today's
              practice?" feedback lives in the ONE daily block after Night,
              not here. */}
          <View style={[styles.sectionCard, getSectionAtmosphere('afternoon').card]}>
            <View pointerEvents="none" style={[styles.sectionGlow, getSectionAtmosphere('afternoon').glow]} />
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              activeOpacity={0.7}
              onPress={() => toggleSection('afternoon')}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: SECTION_TITLE_COLOR.afternoon }]}>
                  {expanded.afternoon ? '▼' : '▶'} {SECTION_LABEL.afternoon.title}
                </Text>
                <Text style={styles.sectionSubtitle}>{SECTION_LABEL.afternoon.subtitle}</Text>
              </View>
              {afternoonDone && <Text style={styles.sectionDoneBadge}>✓ Afternoon practice complete</Text>}
            </TouchableOpacity>

            {expanded.afternoon && (
            <>
            {!afternoonUnlocked ? (
              <Text style={styles.lockedSectionText}>🔒 Complete your Morning practice first</Text>
            ) : (
              <>
              <Text style={styles.focusText}>{practiceDay.afternoon.introduction}</Text>
              {!afternoonDone &&
                visibleActivities.map((activity) => (
                  <View key={activity.id}>{renderActivityGuide('Why this activity?', activity, afternoonEngagement)}</View>
                ))}
              </>
            )}
            </>
            )}
          </View>

          {/* NIGHT - collapsed by default. Expanded: reflection/activity,
              the separate Yes/No repeat-preference, completion. Carry
              Forward / Positive Affirmation / Closing Thought now live in
              their own final section below, shown only once all three
              sections are complete. */}
          <View style={[styles.sectionCard, getSectionAtmosphere('night').card]}>
            <View pointerEvents="none" style={[styles.sectionGlow, getSectionAtmosphere('night').glow]} />
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              activeOpacity={0.7}
              onPress={() => toggleSection('night')}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: SECTION_TITLE_COLOR.night }]}>
                  {expanded.night ? '▼' : '▶'} {SECTION_LABEL.night.title}
                </Text>
                <Text style={styles.sectionSubtitle}>{SECTION_LABEL.night.subtitle}</Text>
              </View>
              {nightDone && <Text style={styles.sectionDoneBadge}>✓ Night practice complete</Text>}
            </TouchableOpacity>

            {expanded.night && (
            <>
            {!nightUnlocked ? (
              <Text style={styles.lockedSectionText}>🔒 Complete your Afternoon practice first</Text>
            ) : (
              <>
              <Text style={styles.focusText}>{practiceDay.night.reflection}</Text>
              {!nightDone && practiceDay.night.activity && (
                <ActivityView activity={practiceDay.night.activity} engagement={nightEngagement} />
              )}

              {!nightDone && !nightActivityExists && (
                <TouchableOpacity style={styles.completeButton} onPress={() => handleCompleteSection('night')}>
                  <Text style={styles.completeButtonText}>I've finished this practice</Text>
                </TouchableOpacity>
              )}
              </>
            )}
            </>
            )}
          </View>

          {/* CARRY FORWARD & CLOSING - a separate final section, shown only
              once Morning + Afternoon + Night are all complete. Reuses the
              exact existing Carry Forward / Positive Affirmation / Closing
              Thought content and interaction - nothing duplicated, just
              relocated out of the Night card. */}
          {dayFullyComplete && (
            <View style={styles.closingSectionCard}>
              <Text style={styles.sectionTitle}>Carry Forward & Closing</Text>

              <View style={styles.carryForwardBlock}>
                <Text style={styles.subheading}>Carry Forward</Text>
                <Text style={styles.carryForwardText}>{practiceDay.night.carryForwardThought}</Text>
              </View>

              {practiceDay.night.affirmation && (
                <View style={styles.affirmationCard}>
                  <Text style={styles.subheading}>✨ Positive Affirmation</Text>
                  <Text style={styles.affirmationText}>{practiceDay.night.affirmation}</Text>
                  {affirmationReadCount < 5 ? (
                    <>
                      <Text style={styles.affirmationProgress}>{affirmationReadCount} of 5</Text>
                      <TouchableOpacity
                        style={styles.tapButton}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setAffirmationReadCount((count) => Math.min(5, count + 1));
                        }}
                      >
                        <Text style={styles.tapButtonText}>{affirmationReadCount === 0 ? "I've Read It" : 'Read Again'}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.affirmationCompleteText}>5 of 5 ✓{'\n'}✨ Affirmation complete.</Text>
                  )}
                </View>
              )}

              {affirmationReadCount >= 5 && practiceDay.night.closingThought && (
                <View style={styles.closingThoughtBlock}>
                  <Text style={styles.subheading}>Closing Thought</Text>
                  <Text style={styles.closingThoughtText}>{practiceDay.night.closingThought}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.tapButton, closingComplete && styles.tapButtonDone]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  if (!closingComplete) {
                    setClosingComplete(true);
                    // The daily celebration now represents completion of the
                    // whole practice journey - Carry Forward & Closing included -
                    // so it fires from here instead of from Night's completion.
                    celebrate();
                  }
                }}
                disabled={closingComplete}
              >
                <Text style={[styles.tapButtonText, closingComplete && styles.tapButtonTextDone]}>
                  {closingComplete ? "✓ I've completed today's practice" : "I've completed today's practice"}
                </Text>
              </TouchableOpacity>

              {/* Anchored here (rather than at the top of the ScrollView) so
                  the celebration appears right where the user just acted,
                  without requiring them to scroll back up to see it. Same
                  celebration state/animation as before - only its position
                  in the tree has moved. */}
              {showCelebration && (
                <Animated.View
                  style={[
                    styles.celebrationBanner,
                    {
                      opacity: celebrationAnim,
                      transform: [{ scale: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                    },
                  ]}
                >
                  <Text style={styles.celebrationTitle}>✨ Today's Practice Complete ✨</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* ONE daily feedback interaction, after Night - not repeated
              after every small activity. Feedback only: never required to
              complete the day's practice, never touches the Ritual Store,
              and never by itself advances to the next day - see the
              separate "Continue" action below. Gated on
              `dayFullyComplete && closingComplete` so it never appears
              before the user has completed Carry Forward & Closing. */}
          {dayFullyComplete && closingComplete && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💭 How was today's practice?</Text>
              <Text style={styles.cardSubtitle}>Select all that apply.</Text>
              <View style={styles.optionsWrap}>
                {DAILY_FEEDBACK_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, dailyFeedback.includes(option.id) && styles.optionButtonSelected]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setDailyFeedback((prev) =>
                        prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id],
                      );
                    }}
                  >
                    <Text style={[styles.optionButtonText, dailyFeedback.includes(option.id) && styles.optionButtonTextSelected]}>
                      {option.emoji} {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {dailyFeedback.length > 0 && <Text style={styles.activitySupportText}>Thanks for sharing.</Text>}
            </View>
          )}

          {/* A separate preference from the experience feedback above - not
              a sixth feedback option, so it gets its own card/heading rather
              than joining `optionsWrap`. Same gating as the feedback card
              (`dayFullyComplete && closingComplete`), same toggle-chip
              visual pattern, but its own independent state. */}
          {dayFullyComplete && closingComplete && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Try something similar again?</Text>
              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  style={[styles.optionButton, wantsSimilarAgain && styles.optionButtonSelected]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setWantsSimilarAgain((prev) => !prev);
                  }}
                >
                  <Text style={[styles.optionButtonText, wantsSimilarAgain && styles.optionButtonTextSelected]}>
                    🔁 I'd like to try something like this again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* The one explicit action that moves on to the next practice day.
              Available once the day is fully complete AND Carry Forward &
              Closing has been completed, whether or not feedback was given
              above - feedback stays optional and never traps the user on a
              completed day. */}
          {dayFullyComplete && closingComplete && (
            <TouchableOpacity style={styles.completeButton} onPress={handleContinueToNextDay}>
              <Text style={styles.completeButtonText}>Continue to your next practice day →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </>
  );

  const yourProgress = (
    <>
      {/* Your Practice Journey: which of the three 7-day Journeys is
          current, the day within it, today's section completion, and where
          the other two Journeys sit relative to it - how the practice is
          progressing, not a re-render of Today's Practice's full content. */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Practice Journey</Text>
        {activeNumber !== null ? (
          <>
            <Text style={styles.cardSubtitle}>Your progress through today's practices.</Text>
            <Text style={styles.journeyHeaderLabel}>
              Journey {journeyPosition.journeyNumber} · {JOURNEY_PHASE[journeyPosition.journeyNumber]}
            </Text>
            <Text style={styles.journeyHeaderDay}>Day {journeyPosition.journeyDay} of 7</Text>
            <JourneyDots journeyDay={journeyPosition.journeyDay} />
            <Text style={styles.journeyDotsCaption}>{journeyPosition.journeyDay - 1} of 7 days completed</Text>

            <Text style={styles.cardSubtitle}>Today's Focus: Number {activeNumber}</Text>

            <View style={styles.progressSectionsBlock}>
              {(['morning', 'afternoon', 'night'] as PracticePart[]).map((part) => (
                <View key={part} style={styles.progressSectionRow}>
                  <Text style={styles.bodyText}>{SECTION_LABEL[part].title}</Text>
                  <Text style={completedParts.includes(part) ? styles.sectionDoneBadge : styles.sectionPendingBadge}>
                    {completedParts.includes(part) ? '✓ Complete' : 'Not yet'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Where the other two Journeys sit - "done" is truthful
                (cycleDay only ever moves past a Journey once every one of
                its 7 days has been fully completed), "upcoming" is plainly
                labelled, never implied to be locked behind a paywall. */}
            <View style={styles.journeyLadder}>
              {JOURNEY_LIST.map((journeyNumber) => {
                const status =
                  journeyNumber < journeyPosition.journeyNumber
                    ? 'done'
                    : journeyNumber === journeyPosition.journeyNumber
                      ? 'current'
                      : 'upcoming';
                return (
                  <View key={journeyNumber} style={styles.journeyLadderRow}>
                    <Text style={styles.journeyLadderLabel}>
                      Journey {journeyNumber} · {JOURNEY_PHASE[journeyNumber]}
                    </Text>
                    <Text
                      style={
                        status === 'done'
                          ? styles.sectionDoneBadge
                          : status === 'current'
                            ? styles.journeyLadderCurrentBadge
                            : styles.sectionPendingBadge
                      }
                    >
                      {status === 'done' ? '✓ Complete' : status === 'current' ? 'In progress' : 'Upcoming'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.cardSubtitle}>No active practice journey right now - every highlighted number has completed its practice.</Text>
        )}
      </View>

      {/* Only shown once a real streak exists - no artificial "0 days"
          message. Deliberately a separate card from Your Practice Journey
          above: the streak is a distinct, calendar-based measure and never
          controls or resets journey progress. */}
      {streakDays > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Streak</Text>
          <Text style={styles.streakProgressText}>
            🔥 {streakDays} {streakDays === 1 ? 'day' : 'days'} in a row
          </Text>
          <Text style={styles.cardSubtitle}>
            Consecutive calendar days with practice activity - separate from your Practice Journey progress above.
          </Text>
        </View>
      )}

      {/* Genuine persisted data only - `completedCycleNumbers` from the
          Ritual Store. No invented history. */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Completed Practice Cycles</Text>
        {completedCycleNumbers.length === 0 ? (
          <Text style={styles.cardSubtitle}>None yet - your first completed cycle will appear here.</Text>
        ) : (
          completedCycleNumbers.map((number) => (
            <Text key={number} style={styles.bodyText}>
              Number {number} ✓
            </Text>
          ))
        )}
      </View>
    </>
  );

  const remediesExperience = (
    <>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'today' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}>Today's Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'progress' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('progress')}
        >
          <Text style={[styles.tabText, selectedTab === 'progress' && styles.tabTextActive]}>Your Progress</Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'today' ? todaysPractice : yourProgress}
    </>
  );

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? null : remediesUnlocked ? (
          remediesExperience
        ) : (
          <LockOverlay onPressCta={() => router.push('/paywall')}>{remediesExperience}</LockOverlay>
        )}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Compass Reminder</Text>
          <Text style={styles.disclaimerText}>
            A gentle reminder: This app is a compass, not a guarantee. We do not promise to solve your
            problems—life does not work that way. What we offer are small, positive nudges to help you remove
            mental blocks and face your day with a lighter heart. Your luck is ultimately shaped by your actions
            and attitude. We are just here to cheer you on.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Readability pass (Step 5.1): darker, higher-contrast text colors and
// larger sizes throughout, following the approximate hierarchy:
//   page/card titles 18-20px, primary body/instruction text 15-16px,
//   secondary explanatory text 14-15px, small metadata 12-13px.
// `fontSize`/`lineHeight` are plain numbers, so RN's default font-scaling
// (not disabled anywhere here) still applies on top of these base sizes.
const TEXT_PRIMARY = '#2C2523';
const TEXT_BODY = '#3A332E';
const TEXT_SECONDARY = '#5B5650';
const TEXT_METADATA = '#6B655E';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 20, paddingBottom: 60 },
  celebrationBanner: {
    backgroundColor: '#5E7563',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '800' },
  philosophyText: { fontSize: 15, color: TEXT_BODY, lineHeight: 23, marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EDEBE6' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20 },
  bodyText: { fontSize: 15, color: TEXT_BODY, lineHeight: 21, marginBottom: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#EEE9E1', borderRadius: 12, padding: 3, marginBottom: 16, marginTop: 4 },
  tabButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 9 },
  tabButtonActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
  tabTextActive: { color: TEXT_PRIMARY, fontWeight: '700' },
  journeyHeader: { marginBottom: 14 },
  journeyHeaderLabel: { fontSize: 19, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 2 },
  journeyHeaderDay: { fontSize: 15, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 2 },
  journeyPhaseText: { fontSize: 12, fontWeight: '800', color: TEXT_METADATA, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  journeyDotsRow: { flexDirection: 'row', gap: 7, marginBottom: 6 },
  journeyDotDone: { fontSize: 17, color: '#5A459D' },
  journeyDotCurrent: { fontSize: 20, color: '#E65100', fontWeight: '800' },
  journeyDotUpcoming: { fontSize: 17, color: '#A39D93' },
  journeyDotsCaption: { fontSize: 12, color: TEXT_METADATA, marginBottom: 4 },
  journeyLadder: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#EDEBE6', paddingTop: 10 },
  journeyLadderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  journeyLadderLabel: { fontSize: 14, color: TEXT_BODY, fontWeight: '600' },
  journeyLadderCurrentBadge: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  focusBadge: { alignSelf: 'flex-start', backgroundColor: '#5E7563', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginBottom: 8 },
  focusBadgeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  focusExplanation: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 16 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EDEBE6', position: 'relative', overflow: 'hidden' },
  sectionGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  sectionCardMorning: { backgroundColor: '#FFF9EF', borderColor: '#F6E8CE', borderLeftWidth: 4, borderLeftColor: '#C2540C' },
  sectionGlowMorning: { backgroundColor: 'rgba(255,176,89,0.18)', top: -50, right: -40 },
  sectionCardAfternoon: { backgroundColor: '#FFFDF8', borderColor: '#F2EAD3', borderLeftWidth: 4, borderLeftColor: '#A8790A' },
  sectionGlowAfternoon: { backgroundColor: 'rgba(255,205,92,0.12)', top: -40, left: -40 },
  sectionCardNight: { backgroundColor: '#F4F1FA', borderColor: '#E2DBF2', borderLeftWidth: 4, borderLeftColor: '#6B4FA0' },
  sectionGlowNight: { backgroundColor: 'rgba(107,91,158,0.16)', bottom: -50, right: -40 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY },
  sectionSubtitle: { fontSize: 13, color: TEXT_SECONDARY },
  sectionDoneBadge: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  sectionPendingBadge: { fontSize: 12, fontWeight: '700', color: TEXT_METADATA },
  subSectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  closingSectionCard: { backgroundColor: '#FFF8E7', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F3E4BE' },
  focusText: { fontSize: 15, color: TEXT_BODY, lineHeight: 22, marginBottom: 10 },
  focusChoiceConfirmedText: { fontSize: 15, fontWeight: '700', color: TEXT_BODY, marginBottom: 10 },
  lockedSectionText: { fontSize: 14, fontStyle: 'italic', color: TEXT_METADATA, marginVertical: 8 },
  subheading: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6, marginTop: 4 },
  colorCueBlock: { marginBottom: 14 },
  colorCueText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 6 },
  colorCueLabel: { fontWeight: '700', color: TEXT_BODY },
  carryForwardBlock: { marginTop: 14 },
  carryForwardText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginTop: 4, fontStyle: 'italic' },
  repeatBlock: { marginTop: 14 },
  repeatPrompt: { fontSize: 14, fontWeight: '700', color: TEXT_BODY, marginBottom: 8 },
  repeatExplainerText: { fontSize: 12, color: TEXT_METADATA, lineHeight: 17, marginBottom: 8 },
  repeatButtonsRow: { flexDirection: 'row', gap: 10 },
  repeatButton: { flex: 1, backgroundColor: '#F4F2FF', borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#DCD4FD' },
  repeatButtonSelected: { backgroundColor: '#5A459D', borderColor: '#5A459D' },
  repeatButtonText: { fontSize: 14, fontWeight: '700', color: TEXT_BODY },
  repeatButtonTextSelected: { color: '#FFFFFF' },
  activityGuideBlock: { marginBottom: 14 },
  guideLabel: { fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  guideText: { fontSize: 15, color: TEXT_BODY, lineHeight: 22, marginBottom: 4 },
  guideExampleText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 2 },
  reminderText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },
  affirmationCard: { backgroundColor: '#F4F2FF', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#DCD4FD' },
  affirmationText: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 23, marginBottom: 10, fontStyle: 'italic' },
  affirmationProgress: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '700', marginBottom: 8 },
  affirmationCompleteText: { fontSize: 14, color: '#2E7D32', fontWeight: '800', lineHeight: 20 },
  closingThoughtBlock: { marginTop: 14 },
  closingThoughtText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, fontStyle: 'italic' },
  activityBlock: { marginBottom: 14 },
  activityPrompt: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  activityInstructions: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 8, lineHeight: 20 },
  activitySupportText: { fontSize: 15, color: TEXT_BODY, lineHeight: 22, marginBottom: 10 },
  patternRow: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 10 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  optionButton: { backgroundColor: '#F4F2FF', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: '#DCD4FD' },
  optionButtonSelected: { backgroundColor: '#5A459D', borderColor: '#5A459D' },
  optionButtonText: { fontSize: 14, fontWeight: '600', color: TEXT_BODY },
  optionButtonTextSelected: { color: '#FFFFFF' },
  ratingButton: { backgroundColor: '#F4F2FF', borderRadius: 18, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCD4FD' },
  tapButton: { backgroundColor: '#EEE9E1', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  tapButtonDone: { backgroundColor: '#E8F5E9' },
  tapButtonText: { fontSize: 15, fontWeight: '700', color: TEXT_BODY },
  tapButtonTextDone: { color: '#2E7D32' },
  completeButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  completeButtonDisabled: { backgroundColor: '#E5E2DA' },
  completeButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  completeButtonTextDisabled: { color: '#9C968B' },
  dayCompleteCard: { backgroundColor: '#F0F9F4', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#C8E6C9' },
  dayCompleteTitle: { fontSize: 17, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  resetCard: { backgroundColor: '#FBF6EC', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#EFE1C2' },
  resetTitle: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6 },
  resetBodyText: { fontSize: 14, color: TEXT_BODY, lineHeight: 20, marginBottom: 8 },
  resetButton: { backgroundColor: '#EFE1C2', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  resetButtonDone: { backgroundColor: '#E8F5E9' },
  resetButtonText: { fontSize: 14, fontWeight: '700', color: '#6E5A3C' },
  resetButtonTextDone: { color: '#2E7D32' },
  progressSectionsBlock: { marginTop: 10 },
  progressSectionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  streakProgressText: { fontSize: 17, fontWeight: '800', color: '#E65100', marginBottom: 4 },
  disclaimerBox: { backgroundColor: '#F5F3EF', borderRadius: 14, padding: 14, marginTop: 12 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800', color: TEXT_SECONDARY, marginBottom: 4 },
  disclaimerText: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 19 },
});
