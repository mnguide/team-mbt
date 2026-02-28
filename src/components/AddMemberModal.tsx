import { useState } from 'react';
import MbtiSelector from './MbtiSelector';
import type { MbtiType, Role } from '../utils/mbti';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (nickname: string, mbtiType: MbtiType, role: Role) => void;
}

const ROLES: { value: Role; label: string; emoji: string }[] = [
  { value: 'boss', label: '상사', emoji: '👔' },
  { value: 'senior', label: '선배', emoji: '🧑‍💼' },
  { value: 'peer', label: '동료', emoji: '🤝' },
  { value: 'junior', label: '후배', emoji: '🌱' },
];

export default function AddMemberModal({ open, onClose, onAdd }: AddMemberModalProps) {
  const [nickname, setNickname] = useState('');
  const [mbtiType, setMbtiType] = useState<MbtiType | null>(null);
  const [role, setRole] = useState<Role>('peer');

  if (!open) return null;

  const canSubmit = nickname.trim().length > 0 && mbtiType !== null;

  const handleSubmit = () => {
    if (!canSubmit || !mbtiType) return;
    onAdd(nickname.trim(), mbtiType, role);
    setNickname('');
    setMbtiType(null);
    setRole('peer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-5">멤버 추가</h2>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="예: 김팀장, 옆자리 린다"
              maxLength={10}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              관계
            </label>
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
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all ${
            canSubmit
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          추가하기
        </button>
      </div>
    </div>
  );
}
