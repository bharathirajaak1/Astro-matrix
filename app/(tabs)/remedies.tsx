import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProfileStore } from '@/features/profile/store';
import { useEntitlement } from '@/features/entitlements';
import { LockOverlay } from '@/ui/components';
import { buildLoShuGrid } from '@/core/loShu';
import { useRitualStore, type PracticePart } from '@/features/remedies/ritualStore';
import { CognitiveTaskCard } from '@/features/remedies/CognitiveTaskCard';
import { resolveActivePracticeDay, resolveCurrentFocusNumber, resolveJourneyPosition } from '@/services/questEngine';
import { PRACTICE_LIBRARY, bodyBreathReset, type PracticeDay } from '@/data/practiceLibrary';
import { tasksForDay, type CognitiveTaskCategory } from '@/data/dailyActivations';
import { isDailyActivationsUnlocked } from '@/features/remedies/dailyActivationsGating';

/** The three successive 7-day Practice Journeys (Remedies Step 6/7) - purely
 *  display labels for the phase each journey represents. `cycleDay` itself
 *  stays the single source of truth; this is never persisted. */
const JOURNEY_PHASE: Record<1 | 2 | 3, string> = {
  1: 'Foundation',
  2: 'Exploration',
  3: 'Integration',
};
const JOURNEY_LIST = [1, 2, 3] as const;

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

/** Display-only label for a Daily Activations category, used solely by the
 *  "Practice N of 5 · Category" progress indicator below - reads the
 *  current task's own `category`, never hardcoded to a specific day. */
const COGNITIVE_CATEGORY_LABEL: Record<CognitiveTaskCategory, string> = {
  logic: 'Logic',
  spatial: 'Spatial',
  memory: 'Memory',
  language: 'Language',
  observation: 'Observation',
};

const DAILY_ACTIVATIONS_INTRO_TEXT =
  'Your Daily Activations bring your personal numerology pattern into a simple daily experience. AstroMatrix uses your Lo Shu Grid and Planes of Expression to identify areas for conscious attention, then guides you through small activities involving attention, thinking, observation and engagement.\n\n' +
  'Each day gives you a simple opportunity to practise, complete and experience something intentionally.';

const BEFORE_YOU_BEGIN_TEXT =
  "Your daily practice is designed to be simple and intentional. It gives you a small opportunity to step outside your usual routine, engage your attention and experience the satisfaction of completing something different.\n\n" +
  'Some of the activities may seem surprisingly simple. That is intentional. They are not designed to test how intelligent you are or to add another difficult responsibility to your day.\n\n' +
  'Instead, each practice gives you a small opportunity to notice, think, remember, solve and complete.\n\n' +
  'Your Color Cue is selected from your numerology profile and provides a simple physical anchor for the practice. The activities that follow are designed as everyday exercises in attention, thinking and engagement.\n\n' +
  'There is no need to rush or perform perfectly. Simply approach the practice with an open mind and complete it at your own pace.';

const ACTIVATION_CYCLE_TEXT =
  'Your Daily Activations are organised into 7-day cycles. Each cycle gives you repeated opportunities to work with your personal focus through simple daily practices.\n\n' +
  "After 7 days, a new cycle begins with a fresh set of activities. Your 21-day journey consists of three cycles, allowing you to experience different practices while continuing to work with your personal numerology pattern.";

const TODAYS_PRACTICE_COMPLETE_TEXT =
  'You gave yourself a few moments to pause, think and engage. Carry that sense of completion with you into the rest of your day.';

/** Shown only once a full 7-day Journey finishes (day 7, fully complete) -
 *  deliberately distinct from `TODAYS_PRACTICE_COMPLETE_TEXT` above (today's
 *  practice) and never describing the full 21-day/three-Journey cycle. */
const JOURNEY_COMPLETE_TEXT =
  "Take a moment to recognise the time and attention you've given to your daily practice. Continue when you're ready for the next day.";

export default function RemediesScreen() {
  const profile = useProfileStore((s: any) => s.profile);
  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);
  const loading = useEntitlement((s) => s.loading);

  const activeDob = profile?.dob || profile?.birthDate || '1995-02-18';
  const loShu = buildLoShuGrid(activeDob);
  // Canonical missing-number source - `loShu.missing` already computes
  // this; no need to re-derive it by hand from `loShu.counts`.
  const missingNumbers = loShu.missing;

  // Gates rendering below alongside the entitlement store's `loading` - the
  // Ritual Store's own hydrate() is async, and without this a fast tap on
  // Color Cue/Reset right after launch could read-and-write the still-
  // default (pre-hydration) state, clobbering whatever was already
  // persisted for the other prerequisite.
  const ritualsHydrated = useRitualStore((s) => s.hydrated);
  const cycleDay = useRitualStore((s) => s.cycleDay);
  const completedParts = useRitualStore((s) => s.completedParts);
  const completedCycleNumbers = useRitualStore((s) => s.completedCycleNumbers);
  const streakDays = useRitualStore((s) => s.streakDays);
  const completeSection = useRitualStore((s) => s.completeSection);
  const advancePracticeDayIfComplete = useRitualStore((s) => s.advancePracticeDayIfComplete);
  // Persisted (AsyncStorage, via the Ritual Store) rather than local state -
  // a local useState here would be lost on app restart, which previously
  // made a completed Color Cue/Reset appear incomplete again after
  // reopening the app even though the practice day hadn't changed.
  const colorCueDoneForDayId = useRitualStore((s) => s.colorCueDoneForDayId);
  const resetDoneForDayId = useRitualStore((s) => s.resetDoneForDayId);
  const markColorCueDone = useRitualStore((s) => s.markColorCueDone);
  const markResetDone = useRitualStore((s) => s.markResetDone);

  const [selectedTab, setSelectedTab] = useState<'today' | 'progress'>('today');
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  // Local-only, transient: independent expand/collapse for the two
  // remaining practice sub-parts (Color Cue, Body & Breath Reset). Opening
  // one never opens or closes the other. Not persisted; reset to all-
  // collapsed below whenever `practiceDay.id` changes.
  const [morningSubExpanded, setMorningSubExpanded] = useState({
    colorCue: false,
    bodyBreath: false,
  });
  const toggleMorningSub = (key: 'colorCue' | 'bodyBreath') => {
    void Haptics.selectionAsync();
    setMorningSubExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local-only, transient: "Before You Begin" is collapsed by default, same
  // "Tap to expand" pattern as Color Cue/Body & Breath Reset above. Not
  // persisted; reset to collapsed below whenever `practiceDay.id` changes.
  const [beforeYouBeginExpanded, setBeforeYouBeginExpanded] = useState(false);
  const toggleBeforeYouBegin = () => {
    void Haptics.selectionAsync();
    setBeforeYouBeginExpanded((prev) => !prev);
  };

  // Local-only, transient: independent expand/collapse per completed number
  // in "Completed Practice Cycles" (Your Progress tab) - same pattern as
  // the toggles above. Not persisted; every number in `completedCycleNumbers`
  // has already completed all 21 days (all three Journeys), so there is no
  // per-number data to fetch here - expanding just reveals that fixed fact.
  const [expandedCompletedNumbers, setExpandedCompletedNumbers] = useState<Record<number, boolean>>({});
  const toggleCompletedNumber = (number: number) => {
    void Haptics.selectionAsync();
    setExpandedCompletedNumbers((prev) => ({ ...prev, [number]: !prev[number] }));
  };

  // The 5-read Positive Affirmation interaction - local/transient only, never
  // persisted, and never a trigger for `completeSection`. Reaching 5 of 5 is
  // what reveals the "Today's Practice Complete" state below - no separate
  // completion tap is needed.
  const [affirmationReadCount, setAffirmationReadCount] = useState(0);

  // The number worked on right now - missing numbers first, in Lo Shu grid
  // order, one at a time through its full 21-day cycle, skipping anything
  // already in `completedCycleNumbers`; falls back to the least-represented
  // digits (rotating by `cycleDay`) once no missing number is eligible. The
  // same `focusNumber` drives both the Journey heading (via `cycleDay`,
  // which now advances through a single number's cycle rather than a
  // rotating pool) and the daily practice content (`practiceDay` below).
  const focusNumber = useMemo(
    () => resolveCurrentFocusNumber(loShu.missing, completedCycleNumbers, loShu.counts, cycleDay),
    [loShu.missing, completedCycleNumbers, loShu.counts, cycleDay],
  );
  const practiceDay: PracticeDay | null = useMemo(
    () => (focusNumber !== null ? resolveActivePracticeDay(PRACTICE_LIBRARY, focusNumber, cycleDay) : null),
    [focusNumber, cycleDay],
  );
  const journeyPosition = useMemo(() => resolveJourneyPosition(cycleDay), [cycleDay]);

  // Daily Activations: the five cognitive tasks for today, selected purely
  // by `cycleDay` via `tasksForDay()` - deliberately NOT by `focusNumber` or
  // `completedCycleNumbers` (those drive Morning's Today's Focus only).
  // Local-only progress through them; never persisted, never sent to the
  // Ritual Store. Shown one at a time, after Night and before Carry Forward
  // & Closing.
  const cognitiveTasks = useMemo(() => tasksForDay(cycleDay), [cycleDay]);
  const [currentCognitiveTaskIndex, setCurrentCognitiveTaskIndex] = useState(0);
  const [currentCognitiveTaskCompleted, setCurrentCognitiveTaskCompleted] = useState(false);
  const [cognitiveTasksDone, setCognitiveTasksDone] = useState(false);

  // Resets whenever the resolved PracticeDay changes, same boundary as the
  // rest of this screen's transient per-day state - a new day must never
  // inherit progress through the previous day's five cognitive tasks.
  useEffect(() => {
    setCurrentCognitiveTaskIndex(0);
    setCurrentCognitiveTaskCompleted(false);
    setCognitiveTasksDone(false);
  }, [practiceDay?.id]);

  const handleCognitiveTaskComplete = () => {
    setCurrentCognitiveTaskCompleted(true);
    if (currentCognitiveTaskIndex === cognitiveTasks.length - 1) {
      setCognitiveTasksDone(true);
    }
  };

  const handleNextCognitiveTask = () => {
    void Haptics.selectionAsync();
    setCurrentCognitiveTaskIndex((index) => index + 1);
    setCurrentCognitiveTaskCompleted(false);
  };

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

  const morningDone = completedParts.includes('morning');
  const afternoonDone = completedParts.includes('afternoon');
  const nightDone = completedParts.includes('night');

  // Reuses the exact Body & Breath Reset content already defined once in
  // the Practice Library (not duplicated here) as a recurring daily
  // supporting practice, separate from the three canonical sections.
  const resetActivity = practiceDay ? bodyBreathReset(`${practiceDay.id}-reset`) : null;
  const resetDone = practiceDay ? resetDoneForDayId === practiceDay.id : false;
  const colorCueDone = practiceDay ? colorCueDoneForDayId === practiceDay.id : false;

  // Morning's remaining two visible sub-parts - Color Cue and Body & Breath
  // Reset - each with their own completion state (now Ritual Store-backed,
  // via `colorCueDoneForDayId`/`resetDoneForDayId` above, so a value already
  // marked done for today's `practiceDay.id` survives an app restart).
  // `morningDone` (the Ritual Store's `completedParts` flag) must only
  // become true once both are done; see the effect below.
  const morningColorCueRequired = Boolean(practiceDay?.morning.colorCue);
  const morningResetRequired = Boolean(resetActivity);
  const morningSubPartsAllComplete = isDailyActivationsUnlocked({
    colorCueRequired: morningColorCueRequired,
    colorCueDone,
    resetRequired: morningResetRequired,
    resetDone,
  });

  // The affirmation read count is tied to a specific day's content - reset
  // it whenever the resolved PracticeDay changes (new cycle day, or a new
  // focus number), exactly as `resetDoneForDayId`/`colorCueDoneForDayId`
  // already do via their own id comparison above.
  useEffect(() => {
    setAffirmationReadCount(0);
    setMorningSubExpanded({ colorCue: false, bodyBreath: false });
    setBeforeYouBeginExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceDay?.id]);

  // Calls the existing `completeSection('morning')` once both visible
  // sub-parts - Color Cue and Body & Breath Reset - are done.
  useEffect(() => {
    if (morningSubPartsAllComplete && !morningDone) {
      handleCompleteSection('morning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morningSubPartsAllComplete, morningDone]);

  // Afternoon and Night no longer have their own visible practice content -
  // Daily Activations now stands in their place in the user-facing flow.
  // Auto-completing them (the same `completeSection` the removed Afternoon/
  // Night UI used to call) once the five Daily Activations are done keeps
  // the Ritual Store's existing `completedParts`/`lastCycleCompletionDate`
  // mechanics - and so `advancePracticeDayIfComplete` - working exactly as
  // before, with zero change to the store itself.
  useEffect(() => {
    if (!cognitiveTasksDone) return;
    if (!afternoonDone) handleCompleteSection('afternoon');
    if (!nightDone) handleCompleteSection('night');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cognitiveTasksDone, afternoonDone, nightDone]);

  // The Positive Affirmation step: some days have no affirmation to read at
  // all (`practiceDay.night.affirmation` unset), in which case there is
  // nothing to tap through and the "Sense of Completion" state becomes
  // available immediately once Daily Activations are done; on days that do
  // have one, it becomes available once all 5 reads are complete.
  const affirmationRequired = Boolean(practiceDay?.night.affirmation);
  const senseOfCompletionReady = cognitiveTasksDone && (!affirmationRequired || affirmationReadCount >= 5);

  // True only on day 7 of a Journey, once that day's required activities
  // are done - never on days 1-6, and never describing the full 21-day
  // cycle. Drives only the Journey-completion message further down (the
  // "X of 7" count below is a separate, more general calculation that
  // applies the same "is today done" check to every day, not just day 7).
  // Disappears naturally once Continue advances `cycleDay` past day 7
  // (journeyPosition recomputes to the new day's journeyDay, and
  // senseOfCompletionReady resets for the new day) - no separate state or
  // gate needed.
  const journeyFullyComplete = journeyPosition.journeyDay === 7 && senseOfCompletionReady;

  // The "X of 7 days completed" count: every day strictly before today is
  // genuinely done (`journeyDay - 1` - `cycleDay` only ever advances once a
  // day is fully completed), plus today itself once `senseOfCompletionReady`
  // - not just on day 7. Clamped to [0, 7] defensively, though the formula
  // itself never leaves that range given `journeyDay` is always 1-7.
  // Pressing Continue advances `cycleDay`, so `journeyPosition` recomputes
  // to the new day and `senseOfCompletionReady` resets for it (existing
  // effect, unchanged) - this naturally reflects the new day's own state,
  // never carrying over the previous day's completion.
  const journeyDaysCompleted = Math.min(
    7,
    Math.max(0, journeyPosition.journeyDay - 1 + (senseOfCompletionReady ? 1 : 0)),
  );

  // Fires the existing celebration animation exactly once, the moment
  // "Sense of Completion" first becomes available - the same animation
  // that previously fired from a separate, now-removed "I've completed
  // today's practice" tap.
  useEffect(() => {
    if (senseOfCompletionReady) celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senseOfCompletionReady]);

  const todaysPractice = (
    <>
      <Text style={styles.pageHeading}>Daily Activations</Text>
      <Text style={[styles.sectionTitle, styles.pageIntroHeading]}>From Your Personal Pattern to Daily Practice</Text>
      <Text style={styles.philosophyText}>{DAILY_ACTIVATIONS_INTRO_TEXT}</Text>

      {focusNumber === null ? (
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
          {/* YOUR ACTIVATION CYCLE - a short explanation of the existing
              7-day Journey concept, immediately above the existing Journey
              header/dots UI (unchanged). */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Activation Cycle</Text>
            <Text style={styles.bodyText}>{ACTIVATION_CYCLE_TEXT}</Text>
          </View>

          <View style={styles.journeyHeader}>
            <Text style={styles.journeyHeaderLabel}>🌿 Journey {journeyPosition.journeyNumber} of 3</Text>
            <Text style={styles.journeyHeaderDay}>Day {journeyPosition.journeyDay} of 7</Text>
            <Text style={styles.journeyPhaseText}>{JOURNEY_PHASE[journeyPosition.journeyNumber]}</Text>
            <JourneyDots journeyDay={journeyPosition.journeyDay} />
            <Text style={styles.journeyDotsCaption}>{journeyDaysCompleted} of 7 days completed</Text>
          </View>

          {/* COLOR CUE. Content and completion behavior unchanged from
              before. */}
          {practiceDay.morning.colorCue && (
            <View style={styles.sectionCard}>
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
                  <Text style={styles.guideLabel}>Find something around you in this color</Text>
                  <Text style={styles.colorCueText}>
                    It can be anything nearby — a pen, notebook, item of clothing, an object, or anything
                    else you can see.
                  </Text>
                  <Text style={styles.guideLabel}>Why this color?</Text>
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
                      if (!colorCueDone) void markColorCueDone(practiceDay.id);
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

          {/* BODY & BREATH RESET - third in the simplified flow. Content and
              completion behavior unchanged from before. */}
          {resetActivity && (
            <View style={styles.sectionCard}>
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
                      if (!resetDone) void markResetDone(practiceDay.id);
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

          {/* DAILY ACTIVATIONS - fourth in the simplified flow: five
              cognitive tasks (Logic, Spatial, Memory, Language,
              Observation), one at a time, selected purely by `cycleDay` via
              `tasksForDay()` - never by Focus Number. Local-only progress,
              never persisted. "Before You Begin" now lives inside this same
              card, directly above the first task, rather than as its own
              standalone section. */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧠 Daily Activations</Text>
            <Text style={styles.sectionSubtitle}>Five quick ways to notice, recall, and think today.</Text>

            {/* BEFORE YOU BEGIN - a plain explanation, not a task: no done-
                state. Collapsed by default. The "Tap to expand" treatment
                reuses Blueprint's existing `primary` accent color (light
                theme `#6C4CE0`), not a newly invented one. The entire
                header - arrow, title, and (when collapsed) "Tap to expand" -
                is one single `TouchableOpacity`, so tapping anywhere in it
                toggles expansion; only the expanded body content sits
                outside it. */}
            <View style={styles.beforeYouBeginBlock}>
              <TouchableOpacity activeOpacity={0.7} onPress={toggleBeforeYouBegin}>
                <Text style={styles.subheading}>
                  {beforeYouBeginExpanded ? '▼' : '▶'} Before You Begin
                </Text>
                {!beforeYouBeginExpanded && <Text style={styles.tapToExpandText}>Tap to expand</Text>}
              </TouchableOpacity>
              {beforeYouBeginExpanded && <Text style={styles.bodyText}>{BEFORE_YOU_BEGIN_TEXT}</Text>}
            </View>

            {!morningSubPartsAllComplete ? (
              <Text style={styles.prerequisiteLockedText}>
                Complete Color Cue and Body & Breath Reset to unlock your daily practices.
              </Text>
            ) : cognitiveTasks.length !== 5 ? (
              <Text style={styles.lockedSectionText}>Today's activations aren't available right now.</Text>
            ) : (
              <>
                <View style={styles.practiceProgressBadge}>
                  <Text style={styles.practiceProgressText}>
                    Practice {currentCognitiveTaskIndex + 1} of {cognitiveTasks.length} ·{' '}
                    {COGNITIVE_CATEGORY_LABEL[cognitiveTasks[currentCognitiveTaskIndex].category]}
                  </Text>
                </View>
                <CognitiveTaskCard
                  task={cognitiveTasks[currentCognitiveTaskIndex]}
                  onComplete={handleCognitiveTaskComplete}
                />
                {currentCognitiveTaskCompleted && !cognitiveTasksDone && (
                  <TouchableOpacity style={styles.completeButton} onPress={handleNextCognitiveTask}>
                    <Text style={styles.completeButtonText}>Next Task</Text>
                  </TouchableOpacity>
                )}
                {cognitiveTasksDone && (
                  <Text style={styles.affirmationCompleteText}>All 5 Daily Activations complete ✓</Text>
                )}
              </>
            )}
          </View>

          {/* SENSE OF COMPLETION - fifth and final in the simplified flow,
              shown only once all five Daily Activations are complete. No
              "Carry Forward" framing (there is no longer a Morning/
              Afternoon/Night to carry anything between); no old feedback
              questionnaire or "try again" prompt. */}
          {true && (
            <View style={styles.closingSectionCard}>
              <Text style={styles.sectionTitle}>Sense of Completion</Text>

              {practiceDay.night.affirmation && (
                <View style={[styles.affirmationCard, affirmationReadCount >= 5 && styles.affirmationCardComplete]}>
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
                    <Text style={styles.affirmationCompleteText}>5 of 5 ✓</Text>
                  )}
                </View>
              )}

              {senseOfCompletionReady && (
                <View style={styles.closingThoughtBlock}>
                  <Text style={styles.subheading}>Today's Practice Complete ✓</Text>
                  <Text style={styles.closingThoughtText}>{TODAYS_PRACTICE_COMPLETE_TEXT}</Text>
                </View>
              )}

              {/* 7-day Journey completion - distinct from the daily message
                  above and from a full 21-day cycle (never claimed here).
                  Only day 7, only once truly done (`journeyFullyComplete`) -
                  so this disappears the moment Continue advances past day 7,
                  with no separate gate or state. A persistent banner (plain
                  View, not Animated.View) - deliberately reuses
                  `celebrationBanner`/`celebrationTitle` for the same visual
                  family as the daily celebration below, but carries no
                  `showCelebration`/`celebrationAnim`/timer of its own, so it
                  stays visible for as long as `journeyFullyComplete` is
                  true rather than fading out after a few seconds. */}
              {true && (
                <View style={styles.celebrationBanner}>
                  <Text style={styles.celebrationTitle}>🎉 You've completed this 7-day Journey! 🎉</Text>
                  <Text style={styles.journeyCompleteTrophy}>🏆</Text>
                  <Text style={styles.journeyCompleteSupportingText}>{JOURNEY_COMPLETE_TEXT}</Text>
                </View>
              )}

              {/* Anchored here (rather than at the top of the ScrollView) so
                  the celebration appears right where the user's attention
                  already is. Same celebration state/animation as before,
                  now triggered automatically once `senseOfCompletionReady`
                  becomes true rather than via a separate tap. */}
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

          {/* The one explicit action that moves on to the next practice day.
              Available once all five Daily Activations AND the Positive
              Affirmation (when there is one to read) are complete. */}
          {senseOfCompletionReady && (
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
        {focusNumber !== null ? (
          <>
            <Text style={styles.cardSubtitle}>Your progress through this 7-day journey.</Text>
            <Text style={styles.journeyHeaderLabel}>
              Journey {journeyPosition.journeyNumber} · {JOURNEY_PHASE[journeyPosition.journeyNumber]}
            </Text>
            <Text style={styles.journeyHeaderDay}>Day {journeyPosition.journeyDay} of 7</Text>
            <JourneyDots journeyDay={journeyPosition.journeyDay} />
            <Text style={styles.journeyDotsCaption}>{journeyDaysCompleted} of 7 days completed</Text>

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
                      {status === 'done' ? '✓ Finished' : status === 'current' ? 'In progress' : 'Upcoming'}
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
        <Text style={styles.cardSubtitle}>A cycle is complete when you finish all three 7-day journeys for a number.</Text>
        {completedCycleNumbers.length === 0 ? (
          <Text style={styles.cardSubtitle}>None yet - your first completed cycle will appear here.</Text>
        ) : (
          completedCycleNumbers.map((number, index) => {
            const isExpanded = Boolean(expandedCompletedNumbers[number]);
            return (
              <View key={number} style={[styles.completedCycleRow, index > 0 && styles.completedCycleDivider]}>
                <TouchableOpacity
                  style={styles.completedCycleHeaderRow}
                  activeOpacity={0.7}
                  onPress={() => toggleCompletedNumber(number)}
                >
                  <Text style={styles.journeyLadderLabel}>
                    {isExpanded ? '▼' : '▶'} Number {number}
                  </Text>
                  <Text style={styles.sectionDoneBadge}>✓ Complete</Text>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.completedJourneyList}>
                    {JOURNEY_LIST.map((journeyNumber) => (
                      <View key={journeyNumber} style={styles.completedJourneyRow}>
                        <View style={styles.completedCycleCheckIcon}>
                          <Text style={styles.completedCycleCheckIconText}>✓</Text>
                        </View>
                        <Text style={styles.journeyLadderLabel}>
                          Journey {journeyNumber} — {JOURNEY_PHASE[journeyNumber]} ✓
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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

      {/* Both subtrees stay mounted at all times - only the inactive one is
          hidden via `display: 'none'` - rather than a ternary that swaps
          which subtree is rendered. A ternary would fully unmount Today's
          Practice (including the in-progress CognitiveTaskCard) every time
          the user switches to Your Progress, discarding the selected
          answer/feedback state on the way back. */}
      <View style={selectedTab === 'today' ? undefined : styles.hiddenTab}>{todaysPractice}</View>
      <View style={selectedTab === 'progress' ? undefined : styles.hiddenTab}>{yourProgress}</View>
    </>
  );

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {loading || !ritualsHydrated ? null : remediesUnlocked ? (
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
  // Hides the inactive Today's Practice / Your Progress subtree without
  // unmounting it, so in-progress state (e.g. a selected cognitive-task
  // answer) survives switching back and forth between the two.
  hiddenTab: { display: 'none' },
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
  // Matches Blueprint's existing "Tap to expand" treatment exactly
  // (`Txt variant="caption" color="primary"`): `#6C4CE0` is that same
  // `primary` token's light-theme value (src/ui/palette.ts) - not a new
  // color invented for this page.
  tapToExpandText: { fontSize: 12, color: '#6C4CE0', fontWeight: '600' },
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
  // Reuses the same accent (`#E65100`) already used by `journeyDotCurrent`/
  // `streakProgressText` on this page - not a new color - so the days-
  // completed count reads as a distinct progress accent rather than plain
  // secondary text, while staying clearly subordinate to `journeyHeaderLabel`.
  journeyDotsCaption: { fontSize: 12, color: '#E65100', fontWeight: '600', marginBottom: 4 },
  journeyLadder: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#EDEBE6', paddingTop: 10 },
  journeyLadderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  journeyLadderLabel: { fontSize: 14, color: TEXT_BODY, fontWeight: '600' },
  journeyLadderCurrentBadge: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  // Completed Practice Cycles: one expandable row per completed number.
  // Reuses `journeyLadderLabel` (row text) and `sectionDoneBadge` (green
  // "Complete" text) already defined above - only the row layout and the
  // small expanded-Journey check icon are new.
  completedCycleRow: { paddingVertical: 10 },
  completedCycleDivider: { borderTopWidth: 1, borderTopColor: '#EDEBE6', marginTop: 2 },
  completedCycleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completedJourneyList: { marginTop: 10, gap: 8, paddingLeft: 4 },
  completedJourneyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Subtle green icon background (`#E8F5E9`, already used elsewhere on this
  // page for `tapButtonDone`/`resetButtonDone`) behind each Journey's check.
  completedCycleCheckIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCycleCheckIconText: { fontSize: 11, fontWeight: '800', color: '#2E7D32' },
  pageHeading: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6 },
  pageIntroHeading: { marginBottom: 8 },
  beforeYouBeginBlock: { marginTop: 10, marginBottom: 14 },
  practiceProgressBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF3E8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
  practiceProgressText: { fontSize: 14, fontWeight: '800', color: '#C2540C', letterSpacing: 0.2 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EDEBE6', position: 'relative', overflow: 'hidden' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY },
  sectionSubtitle: { fontSize: 13, color: TEXT_SECONDARY },
  sectionDoneBadge: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  sectionPendingBadge: { fontSize: 12, fontWeight: '700', color: TEXT_METADATA },
  subSectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  closingSectionCard: { backgroundColor: '#FFF8E7', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F3E4BE' },
  focusChoiceConfirmedText: { fontSize: 15, fontWeight: '700', color: TEXT_BODY, marginBottom: 10 },
  lockedSectionText: { fontSize: 14, fontStyle: 'italic', color: TEXT_METADATA, marginVertical: 8 },
  // Deliberately more prominent than `lockedSectionText` above - this
  // message explains an actionable prerequisite, not generic unavailability,
  // so it uses the same primary/near-black color as headings (`TEXT_PRIMARY`)
  // rather than the muted metadata tone, with no italic.
  prerequisiteLockedText: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY, marginVertical: 12 },
  subheading: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6, marginTop: 4 },
  colorCueText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 6 },
  colorCueLabel: { fontWeight: '700', color: TEXT_BODY },
  guideLabel: { fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  guideExampleText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 2 },
  affirmationCard: { backgroundColor: '#F4F2FF', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#DCD4FD' },
  // Once all 5 reads are done - reuses the same very-light-green/soft-green-
  // border pairing already defined above for `dayCompleteCard`, rather than
  // introducing a new green. Merged onto `affirmationCard` (only overrides
  // these two color properties; padding/radius/spacing stay as they are.
  affirmationCardComplete: { backgroundColor: '#F0F9F4', borderColor: '#C8E6C9' },
  // Deep purple (`#5A459D`, already used elsewhere on this page for
  // `journeyDotDone`) rather than the page's usual near-black body text, so
  // the affirmation itself reads as visually distinct - unchanged once the
  // card's background switches to green above.
  affirmationText: { fontSize: 16, fontWeight: '700', color: '#5A459D', lineHeight: 23, marginBottom: 10, fontStyle: 'italic' },
  affirmationProgress: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '700', marginBottom: 8 },
  affirmationCompleteText: { fontSize: 14, color: '#2E7D32', fontWeight: '800', lineHeight: 20 },
  closingThoughtBlock: { marginTop: 14 },
  closingThoughtText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, fontStyle: 'italic' },
  // Supporting line inside the persistent Journey-completion banner
  // (`styles.celebrationBanner`) - a light, near-white tint rather than
  // `closingThoughtText`'s muted brown, since that color has poor contrast
  // against the banner's dark green background.
  // The trophy on its own centered line, between the heading and the
  // supporting message - `celebrationBanner` already centers its children
  // (`alignItems: 'center'`), so this only needs spacing/size.
  journeyCompleteTrophy: { fontSize: 24, marginTop: 6 },
  journeyCompleteSupportingText: { fontSize: 13, color: '#E7EFE8', lineHeight: 19, textAlign: 'center', marginTop: 4 },
  activityBlock: { marginBottom: 14 },
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
  resetTitle: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6 },
  resetBodyText: { fontSize: 14, color: TEXT_BODY, lineHeight: 20, marginBottom: 8 },
  // Background matches `tapButton`'s exact value (the Color Cue button) -
  // reusing that same color, not introducing a new one. Padding/radius and
  // the button's own text styles are unchanged.
  resetButton: { backgroundColor: '#EEE9E1', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  resetButtonDone: { backgroundColor: '#E8F5E9' },
  resetButtonText: { fontSize: 14, fontWeight: '700', color: '#6E5A3C' },
  resetButtonTextDone: { color: '#2E7D32' },
  streakProgressText: { fontSize: 17, fontWeight: '800', color: '#E65100', marginBottom: 4 },
  disclaimerBox: { backgroundColor: '#F5F3EF', borderRadius: 14, padding: 14, marginTop: 12 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800', color: TEXT_SECONDARY, marginBottom: 4 },
  disclaimerText: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 19 },
});
