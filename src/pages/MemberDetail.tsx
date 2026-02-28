import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTypeInfo } from '../utils/mbti';
import { computeAllPairs, computeMemberInsight, getGradeColor, getGradeBgClass } from '../utils/teamAnalysis';
import type { TeamMember } from '../hooks/useTeamStore';

interface MemberDetailProps {
  members: TeamMember[];
  onUpdateNickname: (id: string, nickname: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  boss: '👔 상사',
  senior: '🧑‍💼 선배',
  peer: '🤝 동료',
  junior: '🌱 후배',
};

export default function MemberDetail({ members, onUpdateNickname }: MemberDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const member = members.find(m => m.id === id);
  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">멤버를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/collection')} className="text-blue-500 font-medium">
            도감으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const info = getTypeInfo(member.mbtiType);
  const allPairs = computeAllPairs(members);
  const insight = computeMemberInsight(member, allPairs);

  // Get all relationships sorted by score
  const relationships = allPairs
    .filter(p => p.memberA.id === member.id || p.memberB.id === member.id)
    .map(p => ({
      partner: p.memberA.id === member.id ? p.memberB : p.memberA,
      chemistry: p.chemistry,
    }))
    .sort((a, b) => b.chemistry.score - a.chemistry.score);

  // Star layout mini graph: center member + connections
  const starSize = 200;
  const cx = starSize / 2;
  const cy = starSize / 2;
  const outerR = 70;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-8">
      <button onClick={() => navigate('/collection')} className="text-gray-400 mb-6">
        &larr; 도감
      </button>

      <div className="text-center mb-6">
        <span className="text-5xl">{info.emoji}</span>
        {editing ? (
          <div className="flex items-center justify-center gap-2 mt-2">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={10}
              className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 w-32"
              autoFocus
            />
            <button
              onClick={() => {
                if (editName.trim()) {
                  onUpdateNickname(member.id, editName.trim());
                }
                setEditing(false);
              }}
              className="text-blue-500 text-sm font-medium"
            >
              완료
            </button>
          </div>
        ) : (
          <h1
            className="text-xl font-black text-gray-900 mt-2 cursor-pointer"
            onClick={() => { setEditName(member.nickname); setEditing(true); }}
          >
            {member.nickname} <span className="text-gray-300 text-sm">&#9998;</span>
          </h1>
        )}
        <p className="text-sm text-gray-500">{member.mbtiType} · {info.title}</p>
        <p className="text-xs text-gray-400 mt-1">{ROLE_LABELS[member.role]}</p>
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
          {/* Star mini graph */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">관계 미니맵</h3>
            <svg viewBox={`0 0 ${starSize} ${starSize}`} className="w-full max-w-[250px] mx-auto">
              {relationships.map((rel, i) => {
                const angle = (2 * Math.PI * i) / relationships.length - Math.PI / 2;
                const x = cx + outerR * Math.cos(angle);
                const y = cy + outerR * Math.sin(angle);
                const partnerInfo = getTypeInfo(rel.partner.mbtiType);
                return (
                  <g key={rel.partner.id}>
                    <line
                      x1={cx} y1={cy} x2={x} y2={y}
                      stroke={getGradeColor(rel.chemistry.grade)}
                      strokeWidth={rel.chemistry.grade === 'S' || rel.chemistry.grade === 'A' ? 2.5 : 1.5}
                      opacity={0.7}
                    />
                    <circle cx={x} cy={y} r={16} fill="white" stroke="#e5e7eb" strokeWidth={1} />
                    <text x={x} y={y - 3} textAnchor="middle" fontSize="12">
                      {partnerInfo.emoji}
                    </text>
                    <text x={x} y={y + 9} textAnchor="middle" fontSize="7" fill="#6b7280" fontWeight="600">
                      {rel.partner.nickname.slice(0, 3)}
                    </text>
                  </g>
                );
              })}
              {/* Center node */}
              <circle cx={cx} cy={cy} r={20} fill="#3B82F6" />
              <text x={cx} y={cy - 3} textAnchor="middle" fontSize="14">
                {info.emoji}
              </text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="white" fontWeight="700">
                {member.nickname.slice(0, 3)}
              </text>
            </svg>
          </div>

          {/* Relationship list */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">전체 관계</h3>
            <div className="space-y-2">
              {relationships.map(rel => {
                const partnerInfo = getTypeInfo(rel.partner.mbtiType);
                return (
                  <button
                    key={rel.partner.id}
                    onClick={() => navigate(`/member/${rel.partner.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                  >
                    <span className="text-xl">{partnerInfo.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800">{rel.partner.nickname}</p>
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
    </div>
  );
}
