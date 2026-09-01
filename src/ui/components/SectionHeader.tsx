import { View } from 'react-native';

import { spacing } from '../theme';
import { Txt } from './Txt';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View
      style={{ gap: spacing.xs, marginTop: spacing.sm }}
      accessibilityRole="header"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <Txt variant="label" color="textMuted">
        {title.toUpperCase()}
      </Txt>
      {subtitle ? (
        <Txt variant="caption" color="textMuted">
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}
