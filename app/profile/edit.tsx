import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { parseISODate } from '@/core/numerology';
import type { NumerologySystem } from '@/core/types';
import { useProfileStore } from '@/features/profile/store';
import { Button, Field, Screen, SegmentedControl, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

export default function EditProfile() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const save = useProfileStore((s) => s.save);
  const reset = useProfileStore((s) => s.reset);

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [dob, setDob] = useState(profile?.dob ?? '');
  const [system, setSystem] = useState<NumerologySystem>(profile?.system ?? 'pythagorean');
  const [errors, setErrors] = useState<{ fullName?: string; dob?: string }>({});
  const [busy, setBusy] = useState(false);

  if (!profile) {
    return <Redirect href="/" />;
  }

  async function onSave() {
    const next: { fullName?: string; dob?: string } = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter the full name used at birth.';
    try {
      parseISODate(dob.trim());
    } catch {
      next.dob = 'Use the format YYYY-MM-DD.';
    }
    setErrors(next);
    if (next.fullName || next.dob) return;

    setBusy(true);
    try {
      await save({ fullName, dob: dob.trim(), system });
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setBusy(true);
    try {
      await reset();
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Txt variant="body" color="textMuted">
        Changing your name or birth date recalculates every reading.
      </Txt>

      <Field
        label="Full name at birth"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoCorrect={false}
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

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <Button label="Save changes" onPress={onSave} loading={busy} />
        <Button label="Start over" variant="ghost" onPress={onReset} disabled={busy} />
      </View>
    </Screen>
  );
}
