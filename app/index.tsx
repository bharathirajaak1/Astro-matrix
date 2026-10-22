import { Redirect } from 'expo-router';

import { useProfileStore } from '@/features/profile/store';

export default function Index() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);

  if (!hydrated) return null;

  return <Redirect href={profile ? '/(tabs)/home' : '/onboarding'} />;
}
