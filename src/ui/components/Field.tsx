import { TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Txt } from './Txt';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, ...inputProps }: FieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <Txt variant="label" color="textMuted">
        {label.toUpperCase()}
      </Txt>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...inputProps}
        style={{
          borderWidth: 1,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: 16,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        }}
      />
      {error ? (
        <Txt variant="caption" color="danger">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" color="textMuted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
