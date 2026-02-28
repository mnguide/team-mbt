import type { ReactNode } from 'react';

interface ResultCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function ResultCard({ children, className = '', id }: ResultCardProps) {
  return (
    <div
      id={id}
      className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

interface GradeBadgeProps {
  grade: string;
  score: number;
}

export function GradeBadge({ grade, score }: GradeBadgeProps) {
  const gradeColors: Record<string, string> = {
    S: 'from-yellow-400 to-orange-500 text-white',
    A: 'from-green-400 to-emerald-500 text-white',
    B: 'from-blue-400 to-blue-500 text-white',
    C: 'from-gray-400 to-gray-500 text-white',
    F: 'from-red-400 to-red-500 text-white',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColors[grade] || gradeColors.B} flex items-center justify-center shadow-lg`}>
        <span className="text-3xl font-black">{grade}</span>
      </div>
      <div>
        <div className="text-sm text-gray-500">케미 점수</div>
        <div className="text-2xl font-bold text-gray-900">{score}점</div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex gap-3 py-2">
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}
