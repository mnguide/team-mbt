import { useState, useCallback, useEffect, useRef } from 'react';

const AD_GROUP_ID = 'ait-ad-test-rewarded-id';

interface RewardedAdCallbacks {
  onRewarded?: () => void;
  onDismiss?: () => void;
}

export function useRewardedAd() {
  const [loading, setLoading] = useState(true);
  const rewardCallbackRef = useRef<(() => void) | undefined>();
  const dismissCallbackRef = useRef<(() => void) | undefined>();
  const cleanupRef = useRef<(() => void) | undefined>();

  const loadAd = useCallback(() => {
    setLoading(true);

    try {
      const { GoogleAdMob } = require('@apps-in-toss/web-framework');

      const isAdUnsupported = GoogleAdMob?.loadAppsInTossAdMob?.isSupported?.() === false;
      if (isAdUnsupported) {
        setLoading(false);
        return;
      }

      cleanupRef.current?.();
      cleanupRef.current = undefined;

      const cleanup = GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event: { type: string }) => {
          if (event.type === 'loaded') {
            setLoading(false);
          }
        },
        onError: () => {
          setLoading(false);
        },
      });

      cleanupRef.current = cleanup;
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAd();
    return () => cleanupRef.current?.();
  }, [loadAd]);

  const showRewardedAd = useCallback(({ onRewarded, onDismiss }: RewardedAdCallbacks) => {
    try {
      const { GoogleAdMob } = require('@apps-in-toss/web-framework');
      const isAdUnsupported = GoogleAdMob?.showAppsInTossAdMob?.isSupported?.() === false;

      if (loading || isAdUnsupported) {
        onDismiss?.();
        return;
      }

      rewardCallbackRef.current = onRewarded;
      dismissCallbackRef.current = onDismiss;

      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event: { type: string }) => {
          switch (event.type) {
            case 'userEarnedReward':
              rewardCallbackRef.current?.();
              rewardCallbackRef.current = undefined;
              break;
            case 'dismissed':
              dismissCallbackRef.current?.();
              dismissCallbackRef.current = undefined;
              loadAd();
              break;
            case 'failedToShow':
              dismissCallbackRef.current?.();
              dismissCallbackRef.current = undefined;
              loadAd();
              break;
          }
        },
        onError: () => {
          dismissCallbackRef.current?.();
          dismissCallbackRef.current = undefined;
          loadAd();
        },
      });
    } catch {
      onRewarded?.();
    }
  }, [loading, loadAd]);

  return { loading, showRewardedAd };
}
