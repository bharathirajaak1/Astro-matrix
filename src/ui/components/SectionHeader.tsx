import { View, type StyleProp, type TextStyle } from 'react-native';

import { spacing } from '../theme';
import { Txt } from './Txt';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional override for the title's own styling (color/weight/size),
   *  on top of the default muted label treatment - used sparingly where a
   *  section title needs to read as a stronger, primary heading. Leaving
   *  this unset preserves the existing look exactly. */
  titleStyle?: StyleProp<TextStyle>;
}

export function SectionHeader({ title, subtitle, titleStyle }: SectionHeaderProps) {
  return (
    <View
      style={{ gap: spacing.xs, marginTop: spacing.sm }}
      accessibilityRole="header"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <Txt variant="label" color="textMuted" style={titleStyle}>
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
