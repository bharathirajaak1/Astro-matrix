import { Text, type TextProps, type TextStyle } from 'react-native';

import { typography, useTheme } from '../theme';

type Variant = keyof typeof typography;
type ColorKey = 'text' | 'textMuted' | 'primary' | 'accent' | 'danger' | 'onPrimary';

interface TxtProps extends TextProps {
  variant?: Variant;
  color?: ColorKey;
  center?: boolean;
}

/** Themed text. Pick a `variant` for size/weight and a `color` token. */
export function Txt({ variant = 'body', color = 'text', center, style, ...rest }: TxtProps) {
  const theme = useTheme();
  const base: TextStyle = {
    ...typography[variant],
    color: theme.colors[color],
    ...(center ? { textAlign: 'center' } : null),
  };
  return <Text {...rest} style={[base, style]} />;
}
