import { View, type ViewStyle } from 'react-native';

import { radius, useTheme } from '../theme';
import { Txt } from './Txt';

interface GridCellProps {
  /** The digit this cell represents in the fixed Lo Shu layout. */
  digit: number;
  /** How many times the digit occurs in the date of birth. */
  count: number;
}

function occurrenceWord(count: number): string {
  if (count === 0) return 'is missing';
  if (count === 1) return 'appears once';
  if (count === 2) return 'appears twice';
  return `appears ${count} times`;
}

export function GridCell({ digit, count }: GridCellProps) {
  const theme = useTheme();
  const filled = count > 0;

  const style: ViewStyle = {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: filled ? theme.colors.gridFilled : theme.colors.gridEmpty,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View
      style={style}
      accessibilityRole="text"
      accessibilityLabel={`Number ${digit} ${occurrenceWord(count)}`}
    >
      {filled ? (
        <Txt variant="title" color="primary" style={{ letterSpacing: 1 }}>
          {String(digit).repeat(count)}
        </Txt>
      ) : (
        <Txt variant="title" color="textMuted" style={{ opacity: 0.35 }}>
          {digit}
        </Txt>
      )}
    </View>
  );
}
