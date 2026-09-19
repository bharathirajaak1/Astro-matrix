import { Alert } from 'react-native';
import { useAdStore } from './adStore';

/**
 * Pluggable Ad Service.
 * In development / offline mode: Simulates a rewarded ad view.
 * When AdMob credentials are ready: Hook Google Mobile Ads RewardedAd here.
 */
export async function showRewardedAdForRemedy(
  remedyKey: string,
  onRewardEarned: () => void
): Promise<void> {
  const adStore = useAdStore.getState();

  if (!adStore.canWatchAd()) {
    Alert.alert(
      'Daily Ad Limit Reached',
      'You have used your 2 free remedy unlocks for today. Come back tomorrow or upgrade to AstroMatrix Plus for unlimited access!'
    );
    return;
  }

  // Development simulation: simulate 1.5s ad playback
  return new Promise((resolve) => {
    Alert.alert(
      '🎬 Rewarded Video Ad',
      'Simulating ad playback... (This will serve Google AdMob video once keys are configured)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(),
        },
        {
          text: 'Complete & Unlock',
          onPress: async () => {
            const success = await adStore.recordAdWatch(remedyKey);
            if (success) {
              onRewardEarned();
            }
            resolve();
          },
        },
      ]
    );
  });
}