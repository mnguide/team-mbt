import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MbtiSelector from '../components/MbtiSelector';
import ResultCard, { InfoRow } from '../components/ResultCard';
import { getTypeInfo } from '../utils/mbti';
import { shareResult, generateShareText } from '../utils/share';
import type { MbtiType } from '../utils/mbti';

interface MyCardProps {
  myType: MbtiType | null;
  onSetMyType: (type: MbtiType) => void;
}

export default function MyCard({ myType, onSetMyType }: MyCardProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<MbtiType | null>(myType);
  const [showResult, setShowResult] = useState(!!myType);
  const [shareToast, setShareToast] = useState('');

  const handleSelect = (type: MbtiType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (!selectedType) return;
    onSetMyType(selectedType);
    setShowResult(true);
  };

  const handleShare = async () => {
    if (!selectedType) return;
    const info = getTypeInfo(selectedType);
    const text = generateShareText('card', {
      emoji: info.emoji,
      title: info.title,
      subtitle: info.subtitle,
    });
    const result = await shareResult('내 K-직장인 유형', text);
    if (result.method === 'copy') {
      setShareToast('클립보드에 복사됨!');
      setTimeout(() => setShareToast(''), 2000);
    }
  };

  if (!showResult || !selectedType) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 mb-6">&larr; 뒤로</button>
        <h1 className="text-xl font-black text-gray-900 mb-2">내 직장인 유형 카드</h1>
        <p className="text-sm text-gray-500 mb-6">MBTI를 선택하면 K-직장인 사용설명서를 받을 수 있어요</p>

        <MbtiSelector value={selectedType} onChange={handleSelect} />

        {selectedType && (
          <button
            onClick={handleConfirm}
            className="w-full mt-6 py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            내 유형 카드 받기
          </button>
        )}
      </div>
    );
  }

  const info = getTypeInfo(selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-6 py-8">
      <button
        onClick={() => { setShowResult(false); setSelectedType(null); }}
        className="text-gray-400 mb-6"
      >
        &larr; 다시 선택
      </button>

      <ResultCard id="my-card-result">
        <div className="text-center mb-4">
          <span className="text-5xl">{info.emoji}</span>
          <div className="mt-3">
            <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
              {selectedType}
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-2">{info.title}</h2>
          <p className="text-sm text-gray-500 mt-1">"{info.subtitle}"</p>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{info.description}</p>

          <div className="space-y-1">
            <InfoRow icon="💻" label="업무 스타일" value={info.workStyle} />
            <InfoRow icon="💬" label="소통 방식" value={info.commStyle} />
            <InfoRow icon="💪" label="강점" value={info.strength} />
            <InfoRow icon="😅" label="약점" value={info.weakness} />
            <InfoRow icon="💣" label="지뢰" value={info.landmine} />
            <InfoRow icon="🍱" label="점심 스타일" value={info.lunchStyle} />
            <InfoRow icon="📱" label="슬랙 스타일" value={info.slackStyle} />
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
            <p className="text-xs text-yellow-800">
              💡 <span className="font-bold">생존 팁:</span> {info.survivalTip}
            </p>
          </div>
        </div>
      </ResultCard>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-white text-gray-800 rounded-2xl font-bold border-2 border-gray-200 active:scale-[0.98] transition-transform"
        >
          📤 결과 공유하기
        </button>

        <button
          onClick={() => navigate('/chemistry')}
          className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
        >
          동료와의 케미 분석해보기 →
        </button>
      </div>

      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm animate-fade-in">
          {shareToast}
        </div>
      )}
    </div>
  );
}
