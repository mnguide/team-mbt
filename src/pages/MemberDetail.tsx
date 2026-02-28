import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MbtiSelector from '../components/MbtiSelector';
import { getTypeInfo } from '../utils/mbti';
import { buildAllMembers, ME_ID, computeAllPairs, computeMemberInsight, getGradeColor, getGradeBgClass } from '../utils/teamAnalysis';
import type { MbtiType, Role } from '../utils/mbti';
import type { TeamMember } from '../hooks/useTeamStore';

interface MemberDetailProps {
  myType: MbtiType | null;
  members: TeamMember[];
  onUpdateMember: (id: string, updates: Partial<Pick<TeamMember, 'nickname' | 'mbtiType' | 'role'>>) => void;
  onRemoveMember: (id: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  boss: '👔 상사',
  senior: '🧑‍💼 선배',
  peer: '🤝 동료',
  junior: '🌱 후배',
};

const ROLES: { value: Role; label: string; emoji: string }[] = [
  { value: 'boss', label: '상사', emoji: '👔' },
  { value: 'senior', label: '선배', emoji: '🧑‍💼' },
  { value: 'peer', label: '동료', emoji: '🤝' },
  { value: 'junior', label: '후배', emoji: '🌱' },
];

export default function MemberDetail({ myType, members, onUpdateMember, onRemoveMember }: MemberDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const allMembers = buildAllMembers(myType, members);
  const member = allMembers.find(m => m.id === id);
  const isMe = id === ME_ID;

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">멤버를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/collection', { replace: true })} className="text-blue-500 font-medium">
            도감으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const info = getTypeInfo(member.mbtiType);
  const allPairs = computeAllPairs(allMembers);
  const insight = computeMemberInsight(member, allPairs);

  const relationships = allPairs
    .filter(p => p.memberA.id === member.id || p.memberB.id === member.id)
    .map(p => ({
      partner: p.memberA.id === member.id ? p.memberB : p.memberA,
      chemistry: p.chemistry,
    }))
    .sort((a, b) => b.chemistry.score - a.chemistry.score);

  const starSize = 200;
  const cx = starSize / 2;
  const cy = starSize / 2;
  const outerR = 70;

  if (editMode && !isMe) {
    return (
      <EditMemberView
        member={member}
        onSave={(updates) => {
          onUpdateMember(member.id, updates);
          setEditMode(false);
        }}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/collection', { replace: true })} className="text-gray-400">
          &larr; 도감
        </button>
        {!isMe && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="text-sm text-blue-500 font-medium px-3 py-1.5 bg-blue-50 rounded-lg"
            >
              수정
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-500 font-medium px-3 py-1.5 bg-red-50 rounded-lg"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <span className="text-5xl">{info.emoji}</span>
        <h1 className="text-xl font-black text-gray-900 mt-2">
          {isMe ? '나' : member.nickname}
          {isMe && <span className="text-sm font-medium text-blue-500 ml-1">(본인)</span>}
        </h1>
        <p className="text-sm text-gray-500">{member.mbtiType} · {info.title}</p>
        {!isMe && <p className="text-xs text-gray-400 mt-1">{ROLE_LABELS[member.role]}</p>}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-gray-900">{insight.avgScore}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">평균 궁합</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {insight.bestPartner?.chemistry.grade ?? '-'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">최고 궁합</p>
          </div>
          <div>
            <p className="text-2xl font-black text-red-500">
              {insight.worstPartner?.chemistry.grade ?? '-'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">최악 궁합</p>
          </div>
        </div>
      </div>

      {relationships.length > 0 && (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">관계 미니맵</h3>
            <svg viewBox={`0 0 ${starSize} ${starSize}`} className="w-full max-w-[250px] mx-auto">
              {relationships.map((rel, i) => {
                const angle = (2 * Math.PI * i) / relationships.length - Math.PI / 2;
                const x = cx + outerR * Math.cos(angle);
                const y = cy + outerR * Math.sin(angle);
                const partnerInfo = getTypeInfo(rel.partner.mbtiType);
                const partnerIsMe = rel.partner.id === ME_ID;
                return (
                  <g key={rel.partner.id}>
                    <line
                      x1={cx} y1={cy} x2={x} y2={y}
                      stroke={getGradeColor(rel.chemistry.grade)}
                      strokeWidth={rel.chemistry.grade === 'S' || rel.chemistry.grade === 'A' ? 2.5 : 1.5}
                      opacity={0.7}
                    />
                    <circle cx={x} cy={y} r={16} fill={partnerIsMe ? '#DBEAFE' : 'white'} stroke={partnerIsMe ? '#3B82F6' : '#e5e7eb'} strokeWidth={1} />
                    <text x={x} y={y - 3} textAnchor="middle" fontSize="12">
                      {partnerInfo.emoji}
                    </text>
                    <text x={x} y={y + 9} textAnchor="middle" fontSize="7" fill="#6b7280" fontWeight="600">
                      {partnerIsMe ? '나' : rel.partner.nickname.slice(0, 3)}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={20} fill={isMe ? '#2563EB' : '#3B82F6'} />
              <text x={cx} y={cy - 3} textAnchor="middle" fontSize="14">
                {info.emoji}
              </text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="white" fontWeight="700">
                {isMe ? '나' : member.nickname.slice(0, 3)}
              </text>
            </svg>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">전체 관계</h3>
            <div className="space-y-2">
              {relationships.map(rel => {
                const partnerInfo = getTypeInfo(rel.partner.mbtiType);
                const partnerIsMe = rel.partner.id === ME_ID;
                return (
                  <button
                    key={rel.partner.id}
                    onClick={() => navigate(`/member/${rel.partner.id}`, { replace: true })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl active:bg-gray-100 transition-colors ${
                      partnerIsMe ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{partnerInfo.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {partnerIsMe ? '나' : rel.partner.nickname}
                        {partnerIsMe && <span className="text-blue-500 text-[10px] ml-1">(본인)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">{rel.partner.mbtiType}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getGradeBgClass(rel.chemistry.grade)}`}>
                        {rel.chemistry.grade} · {rel.chemistry.score}점
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {relationships.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">다른 멤버를 추가하면 관계가 표시됩니다.</p>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-sm w-full">
            <p className="text-gray-900 font-bold mb-2">멤버 삭제</p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{member.nickname}</strong>님을 도감에서 삭제할까요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onRemoveMember(member.id);
                  navigate('/collection', { replace: true });
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditMemberView({
  member,
  onSave,
  onCancel,
}: {
  member: TeamMember;
  onSave: (updates: Partial<Pick<TeamMember, 'nickname' | 'mbtiType' | 'role'>>) => void;
  onCancel: () => void;
}) {
  const [nickname, setNickname] = useState(member.nickname);
  const [mbtiType, setMbtiType] = useState<MbtiType>(member.mbtiType);
  const [role, setRole] = useState<Role>(member.role);

  const hasChanges =
    nickname.trim() !== member.nickname ||
    mbtiType !== member.mbtiType ||
    role !== member.role;

  const handleSave = () => {
    const updates: Partial<Pick<TeamMember, 'nickname' | 'mbtiType' | 'role'>> = {};
    if (nickname.trim() !== member.nickname) updates.nickname = nickname.trim();
    if (mbtiType !== member.mbtiType) updates.mbtiType = mbtiType;
    if (role !== member.role) updates.role = role;
    onSave(updates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-8">
      <button onClick={onCancel} className="text-gray-400 mb-6">
        &larr; 취소
      </button>

      <h1 className="text-xl font-black text-gray-900 mb-6">멤버 수정</h1>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={10}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">관계</label>
          <div className="flex gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  role === r.value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>
        </div>

        <MbtiSelector
          value={mbtiType}
          onChange={setMbtiType}
          label="MBTI 유형"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!nickname.trim() || !hasChanges}
        className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all ${
          nickname.trim() && hasChanges
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        저장하기
      </button>
    </div>
  );
}
