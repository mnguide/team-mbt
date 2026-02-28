import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddMemberModal from '../components/AddMemberModal';
import { getTypeInfo } from '../utils/mbti';
import { getGradeBgClass, buildAllMembers, ME_ID } from '../utils/teamAnalysis';
import { computeAllPairs, computeMemberInsight } from '../utils/teamAnalysis';
import type { MbtiType, Role } from '../utils/mbti';
import type { TeamMember } from '../hooks/useTeamStore';

interface CollectionProps {
  myType: MbtiType | null;
  members: TeamMember[];
  onAddMember: (nickname: string, mbtiType: MbtiType, role: Role) => void;
  onRemoveMember: (id: string) => void;
}

const MAX_MEMBERS = 30;

const ROLE_LABELS: Record<string, string> = {
  boss: '상사',
  senior: '선배',
  peer: '동료',
  junior: '후배',
};

export default function Collection({ myType, members, onAddMember, onRemoveMember }: CollectionProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const allMembers = buildAllMembers(myType, members);
  const allPairs = computeAllPairs(allMembers);
  const progress = Math.round((members.length / MAX_MEMBERS) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-8">
      <button onClick={() => navigate('/home', { replace: true })} className="text-gray-400 mb-4">
        &larr; 홈
      </button>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-black text-gray-900">팀 도감</h1>
        <div className="flex items-center gap-3">
          {members.length > 0 && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`text-sm font-medium px-3 py-1 rounded-lg ${
                editMode ? 'bg-blue-500 text-white' : 'text-blue-500 bg-blue-50'
              }`}
            >
              {editMode ? '완료' : '편집'}
            </button>
          )}
          <span className="text-sm text-gray-500">
            {myType ? members.length + 1 : members.length}/{MAX_MEMBERS}
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!myType && members.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 rounded-xl">
          <p className="text-xs text-amber-700">
            먼저 <button onClick={() => navigate('/my-card')} className="font-bold underline">내 유형</button>을 설정하면 본인도 관계도에 포함됩니다.
          </p>
        </div>
      )}

      {allMembers.length >= 2 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate('/relationship-map')}
            className="flex-1 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 border border-gray-200 active:scale-[0.98] transition-transform"
          >
            🕸️ 관계도
          </button>
          <button
            onClick={() => navigate('/team-insights')}
            className="flex-1 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 border border-gray-200 active:scale-[0.98] transition-transform"
          >
            📊 팀 인사이트
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {allMembers.map(member => {
          const isMe = member.id === ME_ID;
          const info = getTypeInfo(member.mbtiType);
          const insight = computeMemberInsight(member, allPairs);
          const avgGrade = scoreToGrade(insight.avgScore);

          return (
            <div key={member.id} className="relative">
              <button
                onClick={() => navigate(`/member/${member.id}`)}
                className={`w-full rounded-2xl p-3 text-center shadow-sm active:scale-[0.97] transition-transform ${
                  isMe
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <span className="text-3xl">{info.emoji}</span>
                <p className="text-xs font-bold text-gray-800 mt-1 truncate">
                  {isMe ? '나' : member.nickname}
                </p>
                <p className="text-[10px] text-gray-400">{member.mbtiType}</p>
                {!isMe && (
                  <span className="text-[10px] text-gray-400">{ROLE_LABELS[member.role]}</span>
                )}
                {allMembers.length > 1 && !editMode && (
                  <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getGradeBgClass(avgGrade)}`}>
                    avg {insight.avgScore}
                  </span>
                )}
              </button>
              {editMode && !isMe && (
                <button
                  onClick={() => setDeleteTarget(member.id)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm"
                >
                  &times;
                </button>
              )}
            </div>
          );
        })}

        {members.length < MAX_MEMBERS && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gray-50 rounded-2xl p-3 text-center border-2 border-dashed border-gray-300 active:scale-[0.97] transition-transform flex flex-col items-center justify-center min-h-[100px]"
          >
            <span className="text-2xl text-gray-400">+</span>
            <p className="text-xs text-gray-400 mt-1">멤버 추가</p>
          </button>
        )}
      </div>

      {!myType && members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 text-sm">팀원을 추가해서 도감을 채워보세요!</p>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-sm w-full">
            <p className="text-gray-900 font-bold mb-2">멤버 삭제</p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{members.find(m => m.id === deleteTarget)?.nickname}</strong>님을 삭제할까요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onRemoveMember(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <AddMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={onAddMember}
      />
    </div>
  );
}

function scoreToGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'F' {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  if (score >= 35) return 'C';
  return 'F';
}
