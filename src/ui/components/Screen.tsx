import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useTheme } from '../theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a vertical ScrollView (default true). */
  scroll?: boolean;
  /** Extra padding around the content. */
  padded?: boolean;
  contentStyle?: ViewStyle;
}

/** Page shell: themed background + bottom safe-area padding. */
export function Screen({ children, scroll = true, padded = true, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const inner: ViewStyle = {
    padding: padded ? spacing.lg : 0,
    paddingBottom: (padded ? spacing.lg : 0) + insets.bottom + spacing.xl,
    gap: spacing.md,
    ...contentStyle,
  };

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={inner}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={inner}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
