import { Pressable, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Txt } from './Txt';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Txt variant="label" color="textMuted">
          {label.toUpperCase()}
        </Txt>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: spacing.xs,
          gap: spacing.xs,
        }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.sm,
                alignItems: 'center',
                backgroundColor: active ? theme.colors.primary : 'transparent',
              }}
            >
              <Txt variant="caption" color={active ? 'onPrimary' : 'text'}>
                {option.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
