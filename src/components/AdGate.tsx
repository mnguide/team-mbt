import { useState, useCallback } from 'react';
import LoadingScreen from './LoadingScreen';

interface AdGateProps {
  showAd: (callbacks: { onDismiss?: () => void }) => void;
  children: React.ReactNode;
}

export default function AdGate({ showAd, children }: AdGateProps) {
  const [phase, setPhase] = useState<'loading' | 'ad' | 'done'>('loading');

  const handleLoadingComplete = useCallback(() => {
    setPhase('ad');
    showAd({
      onDismiss: () => setPhase('done'),
    });
  }, [showAd]);

  if (phase === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (phase === 'ad') {
    // Waiting for ad to dismiss — show a brief placeholder
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">결과 준비 중...</div>
      </div>
    );
  }

  return <>{children}</>;
}
