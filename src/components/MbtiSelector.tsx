import { useState } from 'react';
import type { MbtiType } from '../utils/mbti';
import { MBTI_TYPES, getTypeInfo } from '../utils/mbti';

interface MbtiSelectorProps {
  value?: MbtiType | null;
  onChange: (type: MbtiType) => void;
  label?: string;
}

const AXES = [
  { label: '에너지 방향', options: [{ value: 'E', label: 'E 외향' }, { value: 'I', label: 'I 내향' }] },
  { label: '인식 기능', options: [{ value: 'S', label: 'S 감각' }, { value: 'N', label: 'N 직관' }] },
  { label: '판단 기능', options: [{ value: 'T', label: 'T 사고' }, { value: 'F', label: 'F 감정' }] },
  { label: '생활 양식', options: [{ value: 'J', label: 'J 판단' }, { value: 'P', label: 'P 인식' }] },
] as const;

type SelectorMode = 'tabs' | 'grid';

export default function MbtiSelector({ value, onChange, label }: MbtiSelectorProps) {
  const [mode, setMode] = useState<SelectorMode>('tabs');
  const [selected, setSelected] = useState<string[]>(
    value ? [value[0], value[1], value[2], value[3]] : []
  );

  const handleAxisSelect = (axisIndex: number, val: string) => {
    const next = [...selected];
    next[axisIndex] = val;
    setSelected(next);

    if (next.length === 4 && next.every(Boolean)) {
      const type = next.join('') as MbtiType;
      if (MBTI_TYPES.includes(type)) {
        onChange(type);
      }
    }
  };

  const handleGridSelect = (type: MbtiType) => {
    setSelected([type[0], type[1], type[2], type[3]]);
    onChange(type);
  };

  const currentType = selected.length === 4 && selected.every(Boolean)
    ? (selected.join('') as MbtiType)
    : null;

  return (
    <div className="space-y-4">
      {label && <p className="text-sm font-medium text-gray-600">{label}</p>}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('tabs')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'tabs' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          하나씩 선택
        </button>
        <button
          onClick={() => setMode('grid')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          전체에서 선택
        </button>
      </div>

      {mode === 'tabs' ? (
        <div className="space-y-3">
          {AXES.map((axis, i) => (
            <div key={axis.label}>
              <p className="text-xs text-gray-400 mb-1.5">{axis.label}</p>
              <div className="flex gap-2">
                {axis.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAxisSelect(i, opt.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      selected[i] === opt.value
                        ? 'bg-blue-500 text-white shadow-md scale-[1.02]'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {MBTI_TYPES.map(type => {
            const info = getTypeInfo(type);
            return (
              <button
                key={type}
                onClick={() => handleGridSelect(type)}
                className={`py-3 px-1 rounded-xl text-center transition-all ${
                  currentType === type
                    ? 'bg-blue-500 text-white shadow-md scale-[1.03]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{info.emoji}</span>
                <p className="text-xs font-bold mt-0.5">{type}</p>
              </button>
            );
          })}
        </div>
      )}

      {currentType && (
        <div className="mt-3 p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-sm text-blue-800 font-medium">
            {getTypeInfo(currentType).emoji} {currentType} 선택됨
          </p>
        </div>
      )}
    </div>
  );
}
