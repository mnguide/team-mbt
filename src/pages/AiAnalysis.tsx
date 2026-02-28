import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ResultCard from '../components/ResultCard';
import { requestAiAnalysis } from '../utils/ai';
import { usePurchase } from '../hooks/usePurchase';
import type { AiScenario } from '../utils/ai';

const SCENARIOS: { value: AiScenario; label: string; emoji: string; desc: string }[] = [
  { value: 'coaching', label: '대화 코칭', emoji: '💬', desc: '상황별 실전 대사 추천' },
  { value: 'villain-sim', label: '빌런 시뮬레이션', emoji: '🎭', desc: '시나리오별 대응 전략' },
  { value: 'team-analysis', label: '심층 분석', emoji: '🔬', desc: '관계 심층 리포트' },
];

const CONTEXTS: Record<AiScenario, { value: string; label: string }[]> = {
  coaching: [
    { value: 'salary', label: '연봉 협상' },
    { value: 'feedback', label: '피드백 주기' },
    { value: 'conflict', label: '갈등 해결' },
    { value: 'request', label: '업무 요청' },
  ],
  'villain-sim': [
    { value: 'passive-aggressive', label: '수동 공격적일 때' },
    { value: 'credit-steal', label: '공 가로챌 때' },
    { value: 'micromanage', label: '마이크로매니징할 때' },
    { value: 'gossip', label: '뒷담화할 때' },
  ],
  'team-analysis': [
    { value: 'project', label: '프로젝트 배치' },
    { value: 'leadership', label: '리더십 스타일' },
    { value: 'growth', label: '성장 방향' },
    { value: 'conflict-prevention', label: '갈등 예방' },
  ],
};

interface LocationState {
  myType: string;
  theirType: string;
  role: string;
}

export default function AiAnalysis({ aiCredits, onUseCredit, onAddCredits }: {
  aiCredits: number;
  onUseCredit: () => void;
  onAddCredits: (n: number) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { purchaseAiTicket, loading: purchaseLoading } = usePurchase();

  const [scenario, setScenario] = useState<AiScenario>('coaching');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  if (!state) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">궁합 분석 결과에서 접근해주세요</p>
        <button onClick={() => navigate('/chemistry')} className="text-blue-500 font-medium">
          궁합 분석하러 가기 →
        </button>
      </div>
    );
  }

  const handlePurchase = () => {
    purchaseAiTicket({
      onSuccess: () => {
        onAddCredits(1);
        setToast('분석권 1회 구매 완료!');
        setTimeout(() => setToast(''), 2000);
      },
      onError: () => {
        setToast('구매에 실패했어요');
        setTimeout(() => setToast(''), 2000);
      },
    });
  };

  const handleAnalyze = async () => {
    if (aiCredits <= 0) {
      setToast('분석권이 없어요. 구매해주세요!');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    if (!context) {
      setToast('상황을 선택해주세요');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    setLoading(true);
    onUseCredit();

    const response = await requestAiAnalysis({
      myType: state.myType,
      theirType: state.theirType,
      role: state.role,
      scenario,
      context,
    });

    setLoading(false);

    if (response.error) {
      setToast(response.error);
      setTimeout(() => setToast(''), 3000);
      onAddCredits(1); // Refund on error
      return;
    }

    setResult(response.result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6">&larr; 뒤로</button>

      <h1 className="text-xl font-black text-gray-900 mb-1">🤖 AI 맞춤 분석</h1>
      <p className="text-sm text-gray-500 mb-2">
        {state.myType} × {state.theirType} 관계를 AI가 심층 분석해요
      </p>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
          분석권 {aiCredits}회 남음
        </span>
        <button
          onClick={handlePurchase}
          disabled={purchaseLoading}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-medium disabled:opacity-50"
        >
          {purchaseLoading ? '처리중...' : '분석권 구매 (₩990)'}
        </button>
      </div>

      {!result ? (
        <>
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-700 mb-3">분석 유형</p>
            <div className="space-y-2">
              {SCENARIOS.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setScenario(s.value); setContext(''); }}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    scenario === s.value ? 'bg-purple-500 text-white' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className={`text-xs ${scenario === s.value ? 'text-purple-100' : 'text-gray-400'}`}>
                      {s.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold text-gray-700 mb-3">상황 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {CONTEXTS[scenario].map(c => (
                <button
                  key={c.value}
                  onClick={() => setContext(c.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    context === c.value ? 'bg-purple-500 text-white' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !context}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading ? '분석 중...' : `AI 분석 받기 (분석권 1회 사용)`}
          </button>
        </>
      ) : (
        <>
          <ResultCard>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="font-bold text-gray-900">AI 맞춤 분석 결과</h3>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {result}
            </div>
          </ResultCard>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => { setResult(''); setContext(''); }}
              className="w-full py-3.5 bg-purple-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-transform"
            >
              다른 상황 분석하기
            </button>
            <button
              onClick={() => navigate('/chemistry')}
              className="w-full py-3 text-blue-500 font-medium text-sm"
            >
              다른 동료 분석하러 가기 →
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
