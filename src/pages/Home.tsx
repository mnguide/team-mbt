import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-6xl mb-4">💼</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">
          우리 팀 케미 보고서
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
          K-직장인 MBTI로 알아보는<br />
          나와 동료의 직장 궁합
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate('/my-card')}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            내 직장인 유형 보기
          </button>

          <button
            onClick={() => navigate('/chemistry')}
            className="w-full py-4 bg-white text-gray-800 rounded-2xl font-bold text-lg border-2 border-gray-200 active:scale-[0.98] transition-transform"
          >
            동료와 궁합 분석하기
          </button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { emoji: '🎯', label: '내 유형 카드', desc: '16가지 K-직장인' },
            { emoji: '💕', label: '궁합 분석', desc: '동료와의 케미' },
            { emoji: '📊', label: '팀 보고서', desc: '우리 팀 분석' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-white/80">
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-xs font-bold text-gray-700 mt-1">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-[10px] text-gray-300">Team MBTI v1.0</p>
      </footer>
    </div>
  );
}
