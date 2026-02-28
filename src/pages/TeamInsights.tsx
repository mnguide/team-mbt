import { useNavigate } from 'react-router-dom';
import MbtiDistributionChart from '../components/MbtiDistributionChart';
import { getTypeInfo, calculateChemistry, determineTeamType } from '../utils/mbti';
import { buildAllMembers, ME_ID, computeAllPairs, computeTeamInsight, getGradeBgClass, getGradeColor } from '../utils/teamAnalysis';
import type { TeamMember } from '../hooks/useTeamStore';
import type { MbtiType, Grade } from '../utils/mbti';

interface TeamInsightsProps {
  myType: MbtiType | null;
  members: TeamMember[];
}

function memberLabel(m: TeamMember): string {
  return m.id === ME_ID ? '나' : m.nickname;
}

export default function TeamInsights({ myType, members }: TeamInsightsProps) {
  const navigate = useNavigate();

  const allMembers = buildAllMembers(myType, members);

  if (allMembers.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-400 text-sm mb-4">
            팀 인사이트를 보려면 최소 2명이 필요합니다.
          </p>
          <button
            onClick={() => navigate('/collection', { replace: true })}
            className="text-blue-500 font-medium text-sm"
          >
            도감에서 멤버 추가하기
          </button>
        </div>
      </div>
    );
  }

  const allPairs = computeAllPairs(allMembers);
  const insight = computeTeamInsight(allMembers, allPairs);
  const teamType = determineTeamType(allMembers.map(m => m.mbtiType));

  const synergyGrade = scoreToGrade(insight.synergyScore);
  const keyConnectorInfo = insight.keyConnector ? getTypeInfo(insight.keyConnector.mbtiType) : null;
  const isolationInfo = insight.isolationRisk ? getTypeInfo(insight.isolationRisk.mbtiType) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-6 py-8">
      <button onClick={() => navigate('/collection', { replace: true })} className="text-gray-400 mb-4">
        &larr; 도감
      </button>

      <h1 className="text-xl font-black text-gray-900 mb-6">팀 인사이트</h1>

      {/* Team Type */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 text-center">
        <span className="text-4xl">{teamType.emoji}</span>
        <h2 className="text-lg font-black text-gray-900 mt-2">{teamType.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{teamType.description}</p>
      </div>

      {/* Synergy Score */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 text-center">
        <p className="text-xs text-gray-400 mb-1">팀 시너지 점수</p>
        <div className="flex items-center justify-center gap-3">
          <span
            className="text-4xl font-black"
            style={{ color: getGradeColor(synergyGrade) }}
          >
            {insight.synergyScore}
          </span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${getGradeBgClass(synergyGrade)}`}>
            {synergyGrade}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          {allMembers.length}명 · 총 {insight.totalPairs}개 관계의 평균
        </p>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">등급 분포</h3>
        <div className="flex gap-2">
          {(['S', 'A', 'B', 'C', 'F'] as Grade[]).map(g => (
            <div key={g} className="flex-1 text-center">
              <div
                className="mx-auto rounded-lg mb-1"
                style={{
                  width: '100%',
                  height: `${Math.max(8, (insight.gradeDistribution[g] / Math.max(insight.totalPairs, 1)) * 80)}px`,
                  backgroundColor: getGradeColor(g),
                  opacity: 0.7,
                }}
              />
              <span className="text-[10px] font-bold text-gray-600">{g}</span>
              <p className="text-[10px] text-gray-400">{insight.gradeDistribution[g]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Connector & Isolation Risk */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {insight.keyConnector && keyConnectorInfo && (
          <button
            onClick={() => navigate(`/member/${insight.keyConnector!.id}`, { replace: true })}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center active:scale-[0.97] transition-transform"
          >
            <p className="text-[10px] text-gray-400 mb-1">핵심 연결자</p>
            <span className="text-2xl">{keyConnectorInfo.emoji}</span>
            <p className="text-xs font-bold text-gray-800 mt-1">
              {memberLabel(insight.keyConnector)}
            </p>
            <p className="text-[10px] text-emerald-600">팀 평균 궁합 최고</p>
          </button>
        )}
        {insight.isolationRisk && isolationInfo && (
          <button
            onClick={() => navigate(`/member/${insight.isolationRisk!.id}`, { replace: true })}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center active:scale-[0.97] transition-transform"
          >
            <p className="text-[10px] text-gray-400 mb-1">고립 위험</p>
            <span className="text-2xl">{isolationInfo.emoji}</span>
            <p className="text-xs font-bold text-gray-800 mt-1">
              {memberLabel(insight.isolationRisk)}
            </p>
            <p className="text-[10px] text-red-500">팀 평균 궁합 최저</p>
          </button>
        )}
      </div>

      {/* Best Triple */}
      {insight.bestTriple && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">베스트 트리오</h3>
          <div className="flex items-center justify-center gap-3">
            {insight.bestTriple.map(m => {
              const info = getTypeInfo(m.mbtiType);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/member/${m.id}`, { replace: true })}
                  className="text-center active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <p className="text-[10px] font-bold text-gray-700 mt-0.5">{memberLabel(m)}</p>
                  <p className="text-[9px] text-gray-400">{m.mbtiType}</p>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-amber-600 font-medium mt-2">
            평균 {insight.bestTripleScore}점
          </p>
        </div>
      )}

      {/* Per-member summary */}
      {myType && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">나와의 궁합 한줄평</h3>
          <div className="space-y-2">
            {members.map(member => {
              const info = getTypeInfo(member.mbtiType);
              const chem = calculateChemistry(myType, member.mbtiType, member.role);
              return (
                <button
                  key={member.id}
                  onClick={() => navigate(`/member/${member.id}`, { replace: true })}
                  className="w-full flex items-start gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-xl">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{member.nickname}</p>
                      <span className="text-[10px] text-gray-400">{member.mbtiType}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getGradeBgClass(scoreToGrade(chem.score))}`}>
                        {chem.grade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{chem.synergy}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MBTI Distribution */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">MBTI 분포</h3>
        <MbtiDistributionChart members={allMembers} />

        {Object.keys(insight.mbtiDistribution).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(insight.mbtiDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span key={type} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {type} x{count}
                </span>
              ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/relationship-map', { replace: true })}
        className="w-full py-3.5 bg-white text-gray-700 rounded-2xl font-bold text-sm border border-gray-200 active:scale-[0.98] transition-transform"
      >
        🕸️ 관계도 보기
      </button>
    </div>
  );
}

function scoreToGrade(score: number): Grade {
  if (score >= 85) return 'S';
  if (score >= 65) return 'A';
  if (score >= 45) return 'B';
  if (score >= 25) return 'C';
  return 'F';
}
