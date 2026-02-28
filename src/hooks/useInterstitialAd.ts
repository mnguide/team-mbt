import { useState, useCallback, useEffect, useRef } from 'react';

const AD_GROUP_ID = 'ait-ad-test-interstitial-id';

interface InterstitialAdCallback {
  onDismiss?: () => void;
}

export function useInterstitialAd() {
  const [loading, setLoading] = useState(true);
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
      // SDK not available (web preview)
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAd();
    return () => cleanupRef.current?.();
  }, [loadAd]);

  const showInterstitialAd = useCallback(({ onDismiss }: InterstitialAdCallback) => {
    try {
      const { GoogleAdMob } = require('@apps-in-toss/web-framework');
      const isAdUnsupported = GoogleAdMob?.showAppsInTossAdMob?.isSupported?.() === false;

      if (loading || isAdUnsupported) {
        onDismiss?.();
        return;
      }

      dismissCallbackRef.current = onDismiss;

      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event: { type: string }) => {
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = undefined;
            loadAd();
          }
        },
        onError: () => {
          dismissCallbackRef.current?.();
          dismissCallbackRef.current = undefined;
          loadAd();
        },
      });
    } catch {
      // SDK not available — skip ad
      onDismiss?.();
    }
  }, [loading, loadAd]);

  return { loading, showInterstitialAd };
}
