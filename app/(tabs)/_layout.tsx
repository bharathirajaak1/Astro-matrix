import { FontAwesome } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/ui/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={{ paddingHorizontal: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <FontAwesome name="cog" size={18} color={theme.colors.primary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="blueprint"
        options={{
          title: 'Blueprint',
          tabBarIcon: ({ color, size }) => <FontAwesome name="th" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Forecast',
          tabBarIcon: ({ color, size }) => <FontAwesome name="sun-o" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="remedies"
        options={{
          title: 'Remedies',
          tabBarIcon: ({ color, size }) => <FontAwesome name="lock" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="numerology"
        options={{ href: null, title: 'Numerology' }}
      />
      <Tabs.Screen
        name="grid"
        options={{ href: null, title: 'Grid' }}
      />
    </Tabs>
  );
}
