import { useState } from 'react';
import { getTypeInfo } from '../utils/mbti';
import { getGradeColor, ME_ID } from '../utils/teamAnalysis';
import type { TeamMember } from '../hooks/useTeamStore';
import type { PairResult } from '../utils/teamAnalysis';

interface RelationshipGraphProps {
  members: TeamMember[];
  pairs: PairResult[];
  onMemberClick?: (id: string) => void;
}

export default function RelationshipGraph({ members, pairs, onMemberClick }: RelationshipGraphProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;

  const positions = members.map((_, i) => {
    const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  const memberIndexMap = new Map(members.map((m, i) => [m.id, i]));

  const handleNodeClick = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  const visiblePairs = pairs.filter(p => {
    if (showAll) return true;
    return p.chemistry.grade === 'S' || p.chemistry.grade === 'A';
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 text-[10px]">
          {(['S', 'A', 'B', 'C', 'F'] as const).map(g => (
            <span key={g} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: getGradeColor(g) }}
              />
              {g}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] text-blue-500 font-medium"
        >
          {showAll ? 'S/A만' : '전체 표시'}
        </button>
      </div>

      <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
        {/* Edges */}
        {visiblePairs.map(p => {
          const iA = memberIndexMap.get(p.memberA.id);
          const iB = memberIndexMap.get(p.memberB.id);
          if (iA === undefined || iB === undefined) return null;

          const isHighlighted =
            selectedId === null ||
            p.memberA.id === selectedId ||
            p.memberB.id === selectedId;

          const strokeWidth = p.chemistry.score >= 90 ? 3 : p.chemistry.score >= 75 ? 2 : 1;

          return (
            <line
              key={`${p.memberA.id}-${p.memberB.id}`}
              x1={positions[iA].x}
              y1={positions[iA].y}
              x2={positions[iB].x}
              y2={positions[iB].y}
              stroke={getGradeColor(p.chemistry.grade)}
              strokeWidth={strokeWidth}
              opacity={isHighlighted ? 0.8 : 0.1}
              style={{ transition: 'opacity 0.2s' }}
            />
          );
        })}

        {/* Nodes */}
        {members.map((member, i) => {
          const info = getTypeInfo(member.mbtiType);
          const isSelected = selectedId === member.id;
          const isMe = member.id === ME_ID;
          const pos = positions[i];

          const fillColor = isSelected ? '#3B82F6' : isMe ? '#DBEAFE' : 'white';
          const strokeColor = isSelected ? '#2563EB' : isMe ? '#3B82F6' : '#e5e7eb';
          const label = isMe ? '나' : member.nickname.slice(0, 4);

          return (
            <g
              key={member.id}
              onClick={() => {
                handleNodeClick(member.id);
                onMemberClick?.(member.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 24 : isMe ? 22 : 20}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected || isMe ? 2 : 1}
                style={{ transition: 'all 0.2s' }}
              />
              <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize="14">
                {info.emoji}
              </text>
              <text
                x={pos.x}
                y={pos.y + 10}
                textAnchor="middle"
                fontSize="7"
                fill={isSelected ? 'white' : '#6b7280'}
                fontWeight={isMe ? '700' : '600'}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedId && (
        <p className="text-center text-xs text-gray-400 mt-2">
          노드를 다시 탭하면 선택 해제
        </p>
      )}
    </div>
  );
}
