import { getTypeInfo } from '../utils/mbti';
import { getGradeColor } from '../utils/teamAnalysis';
import type { TeamMember } from '../hooks/useTeamStore';
import type { PairResult } from '../utils/teamAnalysis';
import type { Grade } from '../utils/mbti';

interface ChemistryMatrixProps {
  members: TeamMember[];
  pairs: PairResult[];
  onCellClick?: (memberAId: string, memberBId: string) => void;
}

export default function ChemistryMatrix({ members, pairs, onCellClick }: ChemistryMatrixProps) {
  // Build lookup map
  const pairMap = new Map<string, { score: number; grade: Grade }>();
  pairs.forEach(p => {
    const key1 = `${p.memberA.id}:${p.memberB.id}`;
    const key2 = `${p.memberB.id}:${p.memberA.id}`;
    pairMap.set(key1, { score: p.chemistry.score, grade: p.chemistry.grade });
    pairMap.set(key2, { score: p.chemistry.score, grade: p.chemistry.grade });
  });

  const cellSize = Math.max(40, Math.min(56, 320 / members.length));

  return (
    <div className="overflow-auto">
      <div
        className="inline-grid"
        style={{
          gridTemplateColumns: `48px repeat(${members.length}, ${cellSize}px)`,
          gridTemplateRows: `48px repeat(${members.length}, ${cellSize}px)`,
        }}
      >
        {/* Top-left empty corner */}
        <div className="sticky left-0 top-0 z-20 bg-white" />

        {/* Column headers */}
        {members.map(m => {
          const info = getTypeInfo(m.mbtiType);
          return (
            <div
              key={`col-${m.id}`}
              className="sticky top-0 z-10 bg-white flex flex-col items-center justify-center"
            >
              <span className="text-sm">{info.emoji}</span>
              <span className="text-[8px] text-gray-500 leading-tight truncate max-w-full px-0.5">
                {m.nickname.slice(0, 3)}
              </span>
            </div>
          );
        })}

        {/* Rows */}
        {members.map((rowMember, ri) => {
          const rowInfo = getTypeInfo(rowMember.mbtiType);
          return [
            // Row header (sticky)
            <div
              key={`row-${rowMember.id}`}
              className="sticky left-0 z-10 bg-white flex items-center justify-center gap-1"
            >
              <span className="text-sm">{rowInfo.emoji}</span>
              <span className="text-[8px] text-gray-500 truncate max-w-[28px]">
                {rowMember.nickname.slice(0, 2)}
              </span>
            </div>,
            // Cells
            ...members.map((colMember, ci) => {
              if (ri === ci) {
                return (
                  <div
                    key={`cell-${ri}-${ci}`}
                    className="flex items-center justify-center bg-gray-50 border border-gray-100"
                  >
                    <span className="text-[10px] text-gray-300">-</span>
                  </div>
                );
              }

              const pair = pairMap.get(`${rowMember.id}:${colMember.id}`);
              if (!pair) return <div key={`cell-${ri}-${ci}`} className="border border-gray-100" />;

              return (
                <div
                  key={`cell-${ri}-${ci}`}
                  onClick={() => onCellClick?.(rowMember.id, colMember.id)}
                  className="flex flex-col items-center justify-center border border-gray-100 cursor-pointer transition-transform active:scale-95"
                  style={{ backgroundColor: `${getGradeColor(pair.grade)}20` }}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: getGradeColor(pair.grade) }}
                  >
                    {pair.grade}
                  </span>
                  <span className="text-[8px] text-gray-500">{pair.score}</span>
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
