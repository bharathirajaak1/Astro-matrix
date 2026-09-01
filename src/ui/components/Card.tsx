import type { ReactNode } from 'react';
import {
  Pressable,
  View,
  type AccessibilityState,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useTheme } from '../theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Use the alt surface colour (for nested cards). */
  alt?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

export function Card({
  children,
  onPress,
  style,
  alt,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: alt ? theme.colors.surfaceAlt : theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        style={({ pressed }) => [base, pressed ? { opacity: 0.7 } : null, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
