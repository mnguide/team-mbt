import type { TeamMember } from '../hooks/useTeamStore';

interface MbtiDistributionChartProps {
  members: TeamMember[];
}

const AXES = [
  { left: 'E', right: 'I', leftLabel: '외향 E', rightLabel: '내향 I', color: '#8B5CF6' },
  { left: 'S', right: 'N', leftLabel: '감각 S', rightLabel: '직관 N', color: '#F59E0B' },
  { left: 'T', right: 'F', leftLabel: '사고 T', rightLabel: '감정 F', color: '#10B981' },
  { left: 'J', right: 'P', leftLabel: '판단 J', rightLabel: '인식 P', color: '#3B82F6' },
] as const;

export default function MbtiDistributionChart({ members }: MbtiDistributionChartProps) {
  const total = members.length;
  if (total === 0) return null;

  const counts: Record<string, number> = {};
  members.forEach(m => {
    for (let i = 0; i < 4; i++) {
      const letter = m.mbtiType[i];
      counts[letter] = (counts[letter] || 0) + 1;
    }
  });

  return (
    <div className="space-y-4">
      {AXES.map(axis => {
        const leftCount = counts[axis.left] || 0;
        const rightCount = counts[axis.right] || 0;
        const leftPct = Math.round((leftCount / total) * 100);
        const rightPct = 100 - leftPct;

        return (
          <div key={axis.left}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 font-medium">
                {axis.leftLabel} ({leftCount})
              </span>
              <span className="text-gray-600 font-medium">
                {axis.rightLabel} ({rightCount})
              </span>
            </div>
            <div className="flex h-7 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-center text-white text-[10px] font-bold transition-all"
                style={{
                  width: `${Math.max(leftPct, 8)}%`,
                  backgroundColor: axis.color,
                }}
              >
                {leftPct}%
              </div>
              <div
                className="flex items-center justify-center text-white text-[10px] font-bold transition-all"
                style={{
                  width: `${Math.max(rightPct, 8)}%`,
                  backgroundColor: `${axis.color}99`,
                }}
              >
                {rightPct}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
