import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { parseISODate } from '@/core/numerology';
import type { NumerologySystem } from '@/core/types';
import { useProfileStore } from '@/features/profile/store';
import { Button, Field, Screen, SegmentedControl, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

export default function Onboarding() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const save = useProfileStore((s) => s.save);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [system, setSystem] = useState<NumerologySystem>('pythagorean');
  const [errors, setErrors] = useState<{ fullName?: string; dob?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!hydrated) {
    return <Screen scroll={false}>{null}</Screen>;
  }
  if (profile) {
    return <Redirect href="/(tabs)/numerology" />;
  }

  async function onSubmit() {
    const next: { fullName?: string; dob?: string } = {};
    if (fullName.trim().length < 2) {
      next.fullName = 'Enter the full name used at birth.';
    }
    try {
      parseISODate(dob.trim());
    } catch {
      next.dob = 'Use the format YYYY-MM-DD, e.g. 1990-04-27.';
    }
    setErrors(next);
    if (next.fullName || next.dob) return;

    setSubmitting(true);
    try {
      await save({ fullName, dob: dob.trim(), system });
      router.replace('/(tabs)/numerology');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.xxl, marginBottom: spacing.lg }}>
        <Txt variant="display" color="primary">
          AstroMatrix
        </Txt>
        <Txt variant="body" color="textMuted">
          Numerology, your Lo Shu grid, and a daily forecast - from a name and a birth date.
        </Txt>
      </View>

      <Field
        label="Full name at birth"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="e.g. Ada Lovelace"
        error={errors.fullName}
      />
      <Field
        label="Date of birth"
        value={dob}
        onChangeText={setDob}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        error={errors.dob}
        hint="Four-digit year, then month, then day."
      />
      <SegmentedControl
        label="Number system"
        value={system}
        onChange={setSystem}
        options={[
          { value: 'pythagorean', label: 'Pythagorean' },
          { value: 'chaldean', label: 'Chaldean' },
        ]}
      />

      <View style={{ marginTop: spacing.md }}>
        <Button label="See my numbers" onPress={onSubmit} loading={submitting} />
      </View>
    </Screen>
  );
}
