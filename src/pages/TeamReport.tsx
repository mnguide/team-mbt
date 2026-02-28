import { useNavigate } from 'react-router-dom';
import ResultCard, { GradeBadge } from '../components/ResultCard';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { calculateChemistry, determineTeamType, getTypeInfo } from '../utils/mbti';
import { shareResult, generateShareText } from '../utils/share';
import type { MbtiType } from '../utils/mbti';
import type { TeamMember } from '../hooks/useTeamStore';
import { useState, useCallback } from 'react';
import AdGate from '../components/AdGate';

interface TeamReportProps {
  myType: MbtiType | null;
  members: TeamMember[];
  onRemoveMember: (id: string) => void;
}

export default function TeamReport({ myType, members, onRemoveMember }: TeamReportProps) {
  const navigate = useNavigate();
  const { showInterstitialAd } = useInterstitialAd();
  const [adPassed, setAdPassed] = useState(members.length === 0);
  const [shareToast, setShareToast] = useState('');

  const handleAdDone = useCallback(() => {
    setAdPassed(true);
  }, []);

  if (!myType) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 flex flex-col items-center justify-center">
        <span className="text-4xl mb-4">🔒</span>
        <p className="text-gray-600 text-center mb-4">먼저 내 유형을 설정해주세요</p>
        <button
          onClick={() => navigate('/my-card')}
          className="py-3 px-6 bg-blue-500 text-white rounded-2xl font-bold"
        >
          내 유형 카드 받기
        </button>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 flex flex-col items-center justify-center">
        <span className="text-4xl mb-4">📊</span>
        <p className="text-gray-600 text-center mb-2 font-bold">팀 보고서</p>
        <p className="text-gray-400 text-center text-sm mb-6">
          궁합 분석을 하면 팀원이 자동으로 추가돼요
        </p>
        <button
          onClick={() => navigate('/chemistry')}
          className="py-3 px-6 bg-blue-500 text-white rounded-2xl font-bold"
        >
          궁합 분석하러 가기
        </button>
      </div>
    );
  }

  if (!adPassed) {
    return (
      <AdGate showAd={(cb) => showInterstitialAd({ onDismiss: () => { handleAdDone(); cb.onDismiss?.(); } })}>
        <div />
      </AdGate>
    );
  }

  // Calculate all chemistries
  const allTypes = [myType, ...members.map(m => m.mbtiType)];
  const teamType = determineTeamType(allTypes);

  type ChemistryPair = { a: string; b: string; score: number; grade: string; synergy: string };
  const pairs: ChemistryPair[] = [];
  members.forEach(member => {
    const chem = calculateChemistry(myType, member.mbtiType, member.role);
    pairs.push({
      a: `나(${myType})`,
      b: `${member.nickname}(${member.mbtiType})`,
      score: chem.score,
      grade: chem.grade,
      synergy: chem.synergy,
    });
  });

  const bestPair = pairs.reduce((best, p) => p.score > best.score ? p : best, pairs[0]);
  const worstPair = pairs.reduce((worst, p) => p.score < worst.score ? p : worst, pairs[0]);

  const handleShare = async () => {
    const text = generateShareText('team', {
      emoji: teamType.emoji,
      teamType: teamType.name,
      description: teamType.description,
    });
    const result = await shareResult('팀MBTI - 우리 팀 케미 보고서', text);
    if (result.method === 'copy') {
      setShareToast('클립보드에 복사됨!');
      setTimeout(() => setShareToast(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6">&larr; 뒤로</button>

      <h1 className="text-xl font-black text-gray-900 mb-1">📊 팀 케미 보고서</h1>
      <p className="text-sm text-gray-500 mb-6">팀원 {members.length}명 분석 완료</p>

      <ResultCard className="mb-4">
        <div className="text-center mb-4">
          <span className="text-5xl">{teamType.emoji}</span>
          <h2 className="text-xl font-black text-gray-900 mt-2">{teamType.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{teamType.description}</p>
        </div>
      </ResultCard>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <ResultCard>
          <p className="text-xs text-gray-400 font-medium mb-1">베스트 궁합 💕</p>
          <p className="text-sm font-bold text-gray-900">{bestPair.a}</p>
          <p className="text-sm font-bold text-gray-900">× {bestPair.b}</p>
          <GradeBadge grade={bestPair.grade} score={bestPair.score} />
        </ResultCard>
        <ResultCard>
          <p className="text-xs text-gray-400 font-medium mb-1">주의 궁합 ⚡</p>
          <p className="text-sm font-bold text-gray-900">{worstPair.a}</p>
          <p className="text-sm font-bold text-gray-900">× {worstPair.b}</p>
          <GradeBadge grade={worstPair.grade} score={worstPair.score} />
        </ResultCard>
      </div>

      <ResultCard className="mb-4">
        <h3 className="font-bold text-gray-900 mb-3">팀원별 한줄평</h3>
        <div className="space-y-3">
          {members.map(member => {
            const info = getTypeInfo(member.mbtiType);
            const chem = calculateChemistry(myType, member.mbtiType, member.role);
            return (
              <div key={member.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{member.nickname}</p>
                    <span className="text-xs text-gray-400">{member.mbtiType}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      chem.grade === 'S' || chem.grade === 'A' ? 'bg-green-100 text-green-700' :
                      chem.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{chem.grade}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{chem.synergy}</p>
                </div>
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="text-gray-300 text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </ResultCard>

      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-white text-gray-800 rounded-2xl font-bold border-2 border-gray-200 active:scale-[0.98] transition-transform"
        >
          📤 팀 보고서 공유하기
        </button>

        <button
          onClick={() => navigate('/chemistry')}
          className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
        >
          다른 동료도 추가하기 →
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
