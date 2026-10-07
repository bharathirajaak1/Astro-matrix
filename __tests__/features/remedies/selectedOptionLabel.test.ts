import { selectedOptionLabel } from '../../../src/features/remedies/selectedOptionLabel';
import type { PracticeActivity } from '../../../src/data/practiceLibrary';

const choiceActivity: PracticeActivity = {
  id: 'n1-d1-morning',
  prompt: 'What is today about?',
  type: 'choice',
  options: [
    { id: 'organize', label: 'Organize' },
    { id: 'simplify', label: 'Simplify' },
    { id: 'begin', label: 'Begin' },
  ],
};

const reflectionActivity: PracticeActivity = {
  id: 'n1-d1-night',
  prompt: 'Reflect on today.',
  type: 'reflection',
  reflectionPrompt: 'What stood out?',
};

describe('selectedOptionLabel', () => {
  test('returns the label of the selected option for a choice activity', () => {
    expect(selectedOptionLabel(choiceActivity, 'organize')).toBe('Organize');
    expect(selectedOptionLabel(choiceActivity, 'simplify')).toBe('Simplify');
    expect(selectedOptionLabel(choiceActivity, 'begin')).toBe('Begin');
  });

  test('returns null when nothing has been selected yet', () => {
    expect(selectedOptionLabel(choiceActivity, undefined)).toBeNull();
  });

  test('returns null for a selection id that does not match any option', () => {
    expect(selectedOptionLabel(choiceActivity, 'not-a-real-option')).toBeNull();
  });

  test('returns null for an activity type with no options (e.g. reflection)', () => {
    expect(selectedOptionLabel(reflectionActivity, 'anything')).toBeNull();
  });

  test('returns null when the selection is a multi-select array rather than a single id', () => {
    expect(selectedOptionLabel(choiceActivity, ['organize', 'begin'])).toBeNull();
  });

  test('is deterministic for the same inputs', () => {
    expect(selectedOptionLabel(choiceActivity, 'organize')).toBe(selectedOptionLabel(choiceActivity, 'organize'));
  });
});
