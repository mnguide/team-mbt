import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResultCard, { GradeBadge, InfoRow } from '../components/ResultCard';
import AdGate from '../components/AdGate';
import { calculateChemistry, getTypeInfo } from '../utils/mbti';
import { shareResult, generateShareText } from '../utils/share';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useRewardedAd } from '../hooks/useRewardedAd';
import type { MbtiType, Role } from '../utils/mbti';

interface ChemistryResultProps {
  analysisCount: number;
  onIncrementAnalysis: () => void;
  onAddMember: (nickname: string, mbtiType: MbtiType, role: Role) => void;
}

export default function ChemistryResult({
  analysisCount,
  onIncrementAnalysis,
  onAddMember,
}: ChemistryResultProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showInterstitialAd } = useInterstitialAd();
  const { showRewardedAd } = useRewardedAd();

  const myType = searchParams.get('my') as MbtiType;
  const theirType = searchParams.get('their') as MbtiType;
  const role = searchParams.get('role') as Role;

  const [showDetailed, setShowDetailed] = useState(false);
  const [adPassed, setAdPassed] = useState(analysisCount === 0);
  const [shareToast, setShareToast] = useState('');

  const chemistry = calculateChemistry(myType, theirType, role);
  const myInfo = getTypeInfo(myType);
  const theirInfo = getTypeInfo(theirType);

  const handleAdDone = useCallback(() => {
    setAdPassed(true);
    onIncrementAnalysis();
    onAddMember(`동료 ${analysisCount + 1}`, theirType, role);
  }, [onIncrementAnalysis, onAddMember, analysisCount, theirType, role]);

  const handleUnlockDetailed = () => {
    showRewardedAd({
      onRewarded: () => setShowDetailed(true),
      onDismiss: () => {},
    });
  };

  const handleShare = async () => {
    const text = generateShareText('chemistry', {
      grade: chemistry.grade,
      myType,
      theirType,
      synergy: chemistry.synergy,
    });
    const result = await shareResult('직장 궁합 결과', text);
    if (result.method === 'copy') {
      setShareToast('클립보드에 복사됨!');
      setTimeout(() => setShareToast(''), 2000);
    }
  };

  if (!adPassed) {
    return (
      <AdGate showAd={(cb) => showInterstitialAd({ onDismiss: () => { handleAdDone(); cb.onDismiss?.(); } })}>
        <div />
      </AdGate>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-8">
      <button onClick={() => navigate('/chemistry')} className="text-gray-400 mb-6">&larr; 다시 분석</button>

      <div className="flex items-center gap-3 mb-6">
        <div className="text-center">
          <span className="text-3xl">{myInfo.emoji}</span>
          <p className="text-xs font-bold text-gray-700 mt-1">{myType}</p>
        </div>
        <span className="text-2xl">×</span>
        <div className="text-center">
          <span className="text-3xl">{theirInfo.emoji}</span>
          <p className="text-xs font-bold text-gray-700 mt-1">{theirType}</p>
        </div>
      </div>

      <ResultCard>
        <GradeBadge grade={chemistry.grade} score={chemistry.score} />
        <p className="text-sm text-gray-500 mt-2">{chemistry.gradeLabel}</p>

        <div className="mt-6 space-y-1">
          <InfoRow icon="✨" label="시너지" value={chemistry.synergy} />
          <InfoRow icon="⚡" label="갈등 포인트" value={chemistry.conflict} />
          <InfoRow icon="💡" label="처세술 팁" value={chemistry.tip} />
        </div>

        {chemistry.specialTip && (
          <div className="mt-4 p-3 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-800">
              🎯 <span className="font-bold">스페셜 팁:</span> {chemistry.specialTip}
            </p>
          </div>
        )}
      </ResultCard>

      {!showDetailed ? (
        <button
          onClick={handleUnlockDetailed}
          className="w-full mt-4 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
        >
          🔒 상세 생존 전략 보기 (광고 시청)
        </button>
      ) : (
        <ResultCard className="mt-4">
          <h3 className="font-bold text-gray-900 mb-3">📋 상세 생존 전략</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-medium text-gray-900">소통할 때</p>
              <p>{theirType[2] === 'F'
                ? '감정을 먼저 인정하고 논리를 나중에 제시하세요.'
                : '결론부터 말하고 근거를 뒤에 붙이세요.'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">갈등이 생겼을 때</p>
              <p>{theirType[0] === 'I'
                ? '즉각적인 대면 대화보다 메시지로 정리한 뒤 대화하세요.'
                : '즉시 대화로 풀되, 감정이 아닌 사안 중심으로 접근하세요.'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">함께 일할 때</p>
              <p>{theirType[3] === 'J'
                ? '마감과 계획을 미리 공유하면 신뢰가 쌓입니다.'
                : '큰 방향만 정하고 세부 실행은 자율에 맡기세요.'}</p>
            </div>
          </div>
        </ResultCard>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-white text-gray-800 rounded-2xl font-bold border-2 border-gray-200 active:scale-[0.98] transition-transform"
        >
          📤 결과 공유하기
        </button>

        <button
          onClick={() => navigate('/ai-analysis', { state: { myType, theirType, role } })}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform"
        >
          🤖 AI가 분석한 맞춤 처세술 받기
        </button>

        <button
          onClick={() => navigate('/chemistry')}
          className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
        >
          다른 동료도 분석하기 →
        </button>

        <button
          onClick={() => navigate('/team-report')}
          className="w-full py-3 text-blue-500 font-medium text-sm"
        >
          📊 팀 보고서 보기
        </button>
      </div>

      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
          {shareToast}
        </div>
      )}
    </div>
  );
}
