import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MbtiSelector from '../components/MbtiSelector';
import type { MbtiType, Role } from '../utils/mbti';

interface ChemistryProps {
  myType: MbtiType | null;
}

const ROLES: { value: Role; label: string; emoji: string; desc: string }[] = [
  { value: 'boss', label: '상사', emoji: '👔', desc: '나의 팀장/매니저예요' },
  { value: 'senior', label: '선배', emoji: '📌', desc: '같은 팀 선배예요' },
  { value: 'peer', label: '동료', emoji: '🤝', desc: '같은 위치의 동료예요' },
  { value: 'junior', label: '후배', emoji: '🌱', desc: '나보다 아랫사람이에요' },
];

export default function Chemistry({ myType }: ChemistryProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('peer');
  const [theirType, setTheirType] = useState<MbtiType | null>(null);

  const handleAnalyze = () => {
    if (!myType || !theirType) return;
    navigate(`/chemistry-result?my=${myType}&their=${theirType}&role=${role}`);
  };

  if (!myType) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 flex flex-col items-center justify-center">
        <span className="text-4xl mb-4">🔒</span>
        <p className="text-gray-600 text-center mb-4">먼저 내 유형을 설정해주세요</p>
        <button
          onClick={() => navigate('/my-card')}
          className="py-3 px-6 bg-blue-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-transform"
        >
          내 유형 카드 받기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6">&larr; 뒤로</button>

      <h1 className="text-xl font-black text-gray-900 mb-1">궁합 분석</h1>
      <p className="text-sm text-gray-500 mb-6">동료의 MBTI로 우리 사이 케미를 분석해요</p>

      <div className="mb-6 p-4 bg-blue-50 rounded-xl">
        <p className="text-xs text-blue-600 font-medium mb-1">나의 유형</p>
        <p className="text-lg font-bold text-blue-800">{myType}</p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-bold text-gray-700 mb-3">상대의 역할은?</p>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                role === r.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              <span className="text-lg">{r.emoji}</span>
              <p className="text-xs font-bold mt-1">{r.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          {ROLES.find(r => r.value === role)?.desc}
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-bold text-gray-700 mb-3">상대의 MBTI는?</p>
        <MbtiSelector value={theirType} onChange={setTheirType} />

        <button
          onClick={() => navigate('/quiz')}
          className="mt-3 text-sm text-blue-500 font-medium"
        >
          🔍 모르겠다면? 행동으로 추론하기
        </button>
      </div>

      {theirType && (
        <button
          onClick={handleAnalyze}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
        >
          궁합 분석하기 🔥
        </button>
      )}
    </div>
  );
}
