import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RelationshipGraph from '../components/RelationshipGraph';
import ChemistryMatrix from '../components/ChemistryMatrix';
import { computeAllPairs } from '../utils/teamAnalysis';
import type { TeamMember } from '../hooks/useTeamStore';

interface RelationshipMapProps {
  members: TeamMember[];
}

type ViewMode = 'graph' | 'matrix';

export default function RelationshipMap({ members }: RelationshipMapProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('graph');

  const allPairs = computeAllPairs(members);

  if (members.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🕸️</p>
          <p className="text-gray-400 text-sm mb-4">
            관계도를 보려면 최소 2명의 멤버가 필요합니다.
          </p>
          <button
            onClick={() => navigate('/collection')}
            className="text-blue-500 font-medium text-sm"
          >
            도감에서 멤버 추가하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-6 py-8">
      <button onClick={() => navigate('/collection')} className="text-gray-400 mb-4">
        &larr; 도감
      </button>

      <h1 className="text-xl font-black text-gray-900 mb-4">관계도</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('graph')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === 'graph'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          🕸️ 네트워크
        </button>
        <button
          onClick={() => setMode('matrix')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === 'matrix'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          📊 매트릭스
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {mode === 'graph' ? (
          <RelationshipGraph
            members={members}
            pairs={allPairs}
            onMemberClick={id => navigate(`/member/${id}`)}
          />
        ) : (
          <ChemistryMatrix
            members={members}
            pairs={allPairs}
            onCellClick={(aId) => navigate(`/member/${aId}`)}
          />
        )}
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-4">
        총 {allPairs.length}개의 궁합 관계
      </p>
    </div>
  );
}
