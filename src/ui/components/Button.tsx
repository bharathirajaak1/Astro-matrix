import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const container: ViewStyle = {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor:
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'secondary'
          ? theme.colors.surface
          : 'transparent',
    borderColor:
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'secondary'
          ? theme.colors.border
          : 'transparent',
    opacity: inactive ? 0.5 : 1,
  };

  const textColor = variant === 'primary' ? 'onPrimary' : 'primary';

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [container, pressed && !inactive ? { opacity: 0.8 } : null]}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors[textColor]} />
          <Txt variant="heading" color={textColor}>
            {label}
          </Txt>
        </View>
      ) : (
        <Txt variant="heading" color={textColor}>
          {label}
        </Txt>
      )}
    </Pressable>
  );
}
