import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  '사내 CCTV 분석 중...',
  '인사팀 기밀 조회 중...',
  '커피 취향으로 성격 파악 중...',
  '슬랙 이모티콘 사용량 집계 중...',
  '월요일 출근 표정 분석 중...',
  '점심 메뉴 선택 패턴 추적 중...',
  '회의실 예약 습관 해독 중...',
  '퇴근 시간 vs 실제 퇴근 시간 비교 중...',
];

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function LoadingScreen({ onComplete, duration = 2500 }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, duration / 50);

    const timer = setTimeout(onComplete, duration);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete, duration]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 px-6">
      <div className="w-20 h-20 mb-8 relative">
        <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
        <div
          className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
      </div>

      <p className="text-white text-lg font-medium mb-2 h-7 transition-opacity">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      <div className="w-48 h-1.5 bg-gray-700 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
