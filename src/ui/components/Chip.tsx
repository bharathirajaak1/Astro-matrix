import { View, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Txt } from './Txt';

type Tone = 'neutral' | 'primary' | 'accent' | 'danger';

interface ChipProps {
  label: string;
  tone?: Tone;
  accessibilityLabel?: string;
}

export function Chip({ label, tone = 'neutral', accessibilityLabel }: ChipProps) {
  const theme = useTheme();

  const bg: Record<Tone, string> = {
    neutral: theme.colors.surfaceAlt,
    primary: theme.colors.primarySoft,
    accent: theme.colors.accentSoft,
    danger: theme.colors.dangerSoft,
  };
  const fg: Record<Tone, 'text' | 'primary' | 'accent' | 'danger'> = {
    neutral: 'text',
    primary: 'primary',
    accent: 'accent',
    danger: 'danger',
  };

  const style: ViewStyle = {
    backgroundColor: bg[tone],
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: 'flex-start',
  };

  return (
    <View style={style} accessibilityLabel={accessibilityLabel ?? label}>
      <Txt variant="caption" color={fg[tone]}>
        {label}
      </Txt>
    </View>
  );
}
