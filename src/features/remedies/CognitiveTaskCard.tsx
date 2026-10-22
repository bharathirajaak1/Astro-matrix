import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CognitiveTask, CognitiveTaskCategory } from '@/data/dailyActivations';
import { shuffleOptions } from './shuffleOptions';

const CATEGORY_LABEL: Record<CognitiveTaskCategory, string> = {
  logic: '🧩 Logic',
  spatial: '🔷 Spatial',
  memory: '🧠 Memory',
  language: '🔤 Language',
  observation: '👁 Observation',
};

type Phase = 'study' | 'question';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

export interface CognitiveTaskCardProps {
  task: CognitiveTask;
  onComplete?: () => void;
}

/**
 * Renders exactly one `CognitiveTask` - reusable for all five categories.
 * Knows nothing about cycleDay, Focus Number, the Ritual Store, or task
 * selection; the parent supplies `task` and is told once, via `onComplete`,
 * when it has been answered correctly. No timer, no score, no persistence.
 */
export function CognitiveTaskCard({ task, onComplete }: CognitiveTaskCardProps) {
  const [phase, setPhase] = useState<Phase>(task.studyContent ? 'study' : 'question');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>('unanswered');

  // Display order only - never the source of truth for correctness. Keyed on
  // `task.id` so it stays stable while this task is being answered and across
  // unrelated parent re-renders, and only changes once a different task loads.
  const displayOptions = useMemo(
    () => shuffleOptions(task.options, task.id),
    [task.id, task.options],
  );

  // A new task must never inherit the previous task's phase/selection/status -
  // re-derive all local interaction state from scratch whenever `task.id`
  // changes. Keyed on `task.id` specifically (not the whole `task` object),
  // so a parent passing a fresh-but-equal object on every render never
  // spuriously resets an in-progress answer.
  useEffect(() => {
    setPhase(task.studyContent ? 'study' : 'question');
    setSelectedOptionId(null);
    setStatus('unanswered');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const handleContinue = () => {
    setPhase('question');
  };

  const handleSelect = (optionId: string) => {
    if (status === 'correct') return; // already complete - no further answering needed
    setSelectedOptionId(optionId);
    if (optionId === task.correctOptionId) {
      setStatus('correct');
      onComplete?.();
    } else {
      setStatus('incorrect');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.category}>{CATEGORY_LABEL[task.category]}</Text>

      {phase === 'study' && task.studyContent ? (
        <>
          <Text style={styles.studyContent}>{task.studyContent}</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.prompt}>{task.prompt}</Text>
          <View style={styles.optionsColumn}>
            {displayOptions.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const showCorrect = status === 'correct' && isSelected;
              const showIncorrect = status === 'incorrect' && isSelected;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionButtonCorrect,
                    showIncorrect && styles.optionButtonIncorrect,
                  ]}
                  onPress={() => handleSelect(option.id)}
                  disabled={status === 'correct'}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      showCorrect && styles.optionButtonTextCorrect,
                      showIncorrect && styles.optionButtonTextIncorrect,
                    ]}
                  >
                    {option.label}
                    {showCorrect ? '  ✓' : ''}
                    {showIncorrect ? '  ✕' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {status === 'correct' && <Text style={styles.statusTextCorrect}>✓ Correct</Text>}
          {status === 'incorrect' && (
            <Text style={styles.statusTextIncorrect}>✕ Not right — try another answer</Text>
          )}
        </>
      )}
    </View>
  );
}

const TEXT_PRIMARY = '#2C2523';
const TEXT_BODY = '#3A332E';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDEBE6',
  },
  category: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 10 },
  studyContent: { fontSize: 15, color: TEXT_BODY, lineHeight: 22, marginBottom: 14 },
  prompt: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 23, marginBottom: 12 },
  optionsColumn: { gap: 10, marginBottom: 6 },
  optionButton: {
    backgroundColor: '#F4F2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCD4FD',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  optionButtonCorrect: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  optionButtonIncorrect: { backgroundColor: '#FBEAE8', borderColor: '#B33A31' },
  optionButtonText: { fontSize: 15, fontWeight: '600', color: TEXT_BODY },
  optionButtonTextCorrect: { color: '#2E7D32', fontWeight: '700' },
  optionButtonTextIncorrect: { color: '#B33A31', fontWeight: '700' },
  statusTextCorrect: { fontSize: 14, fontWeight: '800', color: '#2E7D32', marginTop: 4 },
  statusTextIncorrect: { fontSize: 14, fontWeight: '700', color: '#B33A31', marginTop: 4 },
  continueButton: {
    backgroundColor: '#5E7563',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  continueButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
