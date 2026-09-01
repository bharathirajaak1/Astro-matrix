import { FontAwesome } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Button } from './Button';
import { Txt } from './Txt';

const FILL: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
};

interface LockOverlayProps {
  /** The (non-interactive) preview rendered underneath the scrim. */
  children: ReactNode;
  title?: string;
  message?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

/**
 * Renders a muted preview with a lock scrim on top. The real entitlement /
 * paywall wiring arrives in Milestone 4; for now `onPressCta` is optional and
 * the button is inert when omitted.
 */
export function LockOverlay({
  children,
  title = 'This content is locked',
  message = 'Unlock AstroMatrix Plus to see the full content.',
  ctaLabel = "See what's included",
  onPressCta,
}: LockOverlayProps) {
  const theme = useTheme();

  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
      <View
        style={{ opacity: 0.25 }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
      <View style={[FILL, { padding: spacing.xl, gap: spacing.md, backgroundColor: theme.colors.overlay }]}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface,
          }}
        >
          <FontAwesome name="lock" size={26} color={theme.colors.primary} />
        </View>
        <Txt variant="heading" color="onPrimary" center>
          {title}
        </Txt>
        <Txt variant="body" color="onPrimary" center style={{ opacity: 0.9 }}>
          {message}
        </Txt>
        <View style={{ alignSelf: 'stretch' }}>
          <Button label={ctaLabel} variant="secondary" disabled={!onPressCta} onPress={onPressCta} />
        </View>
      </View>
    </View>
  );
}
