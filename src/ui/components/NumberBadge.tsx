import { View, type ViewStyle } from 'react-native';

import { isMasterNumber } from '@/core/numerology';

import { radius, useTheme } from '../theme';
import { Txt } from './Txt';

interface NumberBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const DIMENSIONS = {
  sm: { box: 36, font: 16 },
  md: { box: 52, font: 22 },
  lg: { box: 72, font: 32 },
} as const;

/** Circular number token. Master numbers (11/22/33) get an accent ring. */
export function NumberBadge({ value, size = 'md', label }: NumberBadgeProps) {
  const theme = useTheme();
  const dim = DIMENSIONS[size];
  const master = isMasterNumber(value);

  const style: ViewStyle = {
    width: dim.box,
    height: dim.box,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: master ? theme.colors.accentSoft : theme.colors.primarySoft,
    borderWidth: master ? 2 : 1,
    borderColor: master ? theme.colors.accent : theme.colors.border,
  };

  return (
    <View
      style={style}
      accessibilityRole="text"
      accessibilityLabel={label ?? `Number ${value}${master ? ', a master number' : ''}`}
    >
      <Txt
        variant="title"
        color={master ? 'accent' : 'primary'}
        style={{ fontSize: dim.font, fontWeight: '700' }}
      >
        {value}
      </Txt>
    </View>
  );
}
