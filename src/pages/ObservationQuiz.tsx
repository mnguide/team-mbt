import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import rawQuizData from '../data/quiz.json';
import ResultCard from '../components/ResultCard';
import AdGate from '../components/AdGate';
import { inferMbtiFromScores, getConfidenceLevel, getTypeInfo } from '../utils/mbti';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import type { MbtiType } from '../utils/mbti';

interface QuizOption {
  text: string;
  scores: Record<string, number>;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

const quizData = rawQuizData as unknown as { title: string; subtitle: string; questions: QuizQuestion[] };

interface ObservationQuizProps {
  myType: MbtiType | null;
}

export default function ObservationQuiz({ myType }: ObservationQuizProps) {
  const navigate = useNavigate();
  const { showInterstitialAd } = useInterstitialAd();

  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'quiz' | 'loading' | 'result'>('quiz');
  const [adPassed, setAdPassed] = useState(false);

  const questions = quizData.questions;
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleAnswer = (optionScores: Record<string, number>) => {
    const next = { ...scores };
    Object.entries(optionScores).forEach(([key, value]) => {
      next[key] = (next[key] || 0) + value;
    });
    setScores(next);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setPhase('loading');
    }
  };

  const handleAdDone = useCallback(() => {
    setAdPassed(true);
    setPhase('result');
  }, []);

  if (phase === 'loading' && !adPassed) {
    return (
      <AdGate showAd={(cb) => showInterstitialAd({ onDismiss: () => { handleAdDone(); cb.onDismiss?.(); } })}>
        <div />
      </AdGate>
    );
  }

  if (phase === 'result') {
    const inferredType = inferMbtiFromScores(scores);
    const confidence = getConfidenceLevel(scores);
    const info = getTypeInfo(inferredType);

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-6 py-8">
        <h1 className="text-xl font-black text-gray-900 mb-1">🔍 관찰 결과</h1>
        <p className="text-sm text-gray-500 mb-6">행동 패턴 분석 완료!</p>

        <ResultCard>
          <div className="text-center mb-4">
            <span className="text-5xl">{info.emoji}</span>
            <div className="mt-3">
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                추론 신뢰도 {confidence}%
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-2">
              이 동료는 {inferredType}일 가능성이 높아요
            </h2>
            <p className="text-sm text-gray-500 mt-1">{info.title}</p>
          </div>
        </ResultCard>

        <div className="mt-6 space-y-3">
          {myType && (
            <button
              onClick={() => navigate(`/chemistry-result?my=${myType}&their=${inferredType}&role=peer`)}
              className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              이 동료와 궁합 분석하기 →
            </button>
          )}
          <button
            onClick={() => { setCurrentQ(0); setScores({}); setPhase('quiz'); setAdPassed(false); }}
            className="w-full py-3 text-gray-500 font-medium text-sm"
          >
            다시 하기
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 mb-6">&larr; 뒤로</button>

      <h1 className="text-xl font-black text-gray-900 mb-1">🔍 관찰 카메라</h1>
      <p className="text-sm text-gray-500 mb-4">동료의 평소 행동을 떠올려 답해주세요</p>

      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-6">
        <span className="text-xs text-gray-400 font-medium">
          Q{currentQ + 1} / {questions.length}
        </span>
        <h2 className="text-lg font-bold text-gray-900 mt-1">{q.question}</h2>
      </div>

      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt.scores)}
            className="w-full p-4 bg-gray-50 rounded-xl text-left text-sm text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] transition-all"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
