import { calculateChemistry } from './mbti';
import type { MbtiType, Grade, ChemistryResult } from './mbti';
import type { TeamMember } from '../hooks/useTeamStore';

export const ME_ID = '__me__';

export function createMeMember(myType: MbtiType): TeamMember {
  return {
    id: ME_ID,
    nickname: '나',
    mbtiType: myType,
    role: 'peer',
    addedAt: 0,
  };
}

export function buildAllMembers(myType: MbtiType | null, members: TeamMember[]): TeamMember[] {
  if (!myType) return members;
  return [createMeMember(myType), ...members];
}

export interface PairResult {
  memberA: TeamMember;
  memberB: TeamMember;
  chemistry: ChemistryResult;
}

export interface MemberInsight {
  member: TeamMember;
  avgScore: number;
  bestPartner: { member: TeamMember; chemistry: ChemistryResult } | null;
  worstPartner: { member: TeamMember; chemistry: ChemistryResult } | null;
  connectionCount: Record<Grade, number>;
}

export interface TeamInsight {
  synergyScore: number;
  keyConnector: TeamMember | null;
  isolationRisk: TeamMember | null;
  bestTriple: [TeamMember, TeamMember, TeamMember] | null;
  bestTripleScore: number;
  mbtiDistribution: Record<string, number>;
  gradeDistribution: Record<Grade, number>;
  totalPairs: number;
}

export function computeAllPairs(members: TeamMember[]): PairResult[] {
  const pairs: PairResult[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const chemistry = calculateChemistry(
        members[i].mbtiType,
        members[j].mbtiType,
        'peer'
      );
      pairs.push({ memberA: members[i], memberB: members[j], chemistry });
    }
  }
  return pairs;
}

export function computeMemberInsight(
  member: TeamMember,
  allPairs: PairResult[]
): MemberInsight {
  const myPairs = allPairs.filter(
    p => p.memberA.id === member.id || p.memberB.id === member.id
  );

  if (myPairs.length === 0) {
    return {
      member,
      avgScore: 0,
      bestPartner: null,
      worstPartner: null,
      connectionCount: { S: 0, A: 0, B: 0, C: 0, F: 0 },
    };
  }

  const scores = myPairs.map(p => p.chemistry.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const sorted = [...myPairs].sort((a, b) => b.chemistry.score - a.chemistry.score);
  const bestPair = sorted[0];
  const worstPair = sorted[sorted.length - 1];

  const getPartner = (pair: PairResult) =>
    pair.memberA.id === member.id ? pair.memberB : pair.memberA;

  const connectionCount: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, F: 0 };
  myPairs.forEach(p => {
    connectionCount[p.chemistry.grade]++;
  });

  return {
    member,
    avgScore,
    bestPartner: { member: getPartner(bestPair), chemistry: bestPair.chemistry },
    worstPartner: { member: getPartner(worstPair), chemistry: worstPair.chemistry },
    connectionCount,
  };
}

export function findBestTriple(
  members: TeamMember[],
  allPairs: PairResult[]
): { triple: [TeamMember, TeamMember, TeamMember]; score: number } | null {
  if (members.length < 3) return null;

  const pairMap = new Map<string, number>();
  allPairs.forEach(p => {
    const key1 = `${p.memberA.id}-${p.memberB.id}`;
    const key2 = `${p.memberB.id}-${p.memberA.id}`;
    pairMap.set(key1, p.chemistry.score);
    pairMap.set(key2, p.chemistry.score);
  });

  let bestTriple: [TeamMember, TeamMember, TeamMember] | null = null;
  let bestScore = -1;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      for (let k = j + 1; k < members.length; k++) {
        const s1 = pairMap.get(`${members[i].id}-${members[j].id}`) ?? 0;
        const s2 = pairMap.get(`${members[j].id}-${members[k].id}`) ?? 0;
        const s3 = pairMap.get(`${members[i].id}-${members[k].id}`) ?? 0;
        const avg = Math.round((s1 + s2 + s3) / 3);
        if (avg > bestScore) {
          bestScore = avg;
          bestTriple = [members[i], members[j], members[k]];
        }
      }
    }
  }

  return bestTriple ? { triple: bestTriple, score: bestScore } : null;
}

export function computeTeamInsight(
  members: TeamMember[],
  allPairs: PairResult[]
): TeamInsight {
  const gradeDistribution: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, F: 0 };
  allPairs.forEach(p => {
    gradeDistribution[p.chemistry.grade]++;
  });

  const synergyScore =
    allPairs.length > 0
      ? Math.round(allPairs.reduce((sum, p) => sum + p.chemistry.score, 0) / allPairs.length)
      : 0;

  // Key connector: highest average score across all their connections
  const memberInsights = members.map(m => computeMemberInsight(m, allPairs));
  const sorted = [...memberInsights].sort((a, b) => b.avgScore - a.avgScore);
  const keyConnector = sorted.length > 0 ? sorted[0].member : null;
  const isolationRisk = sorted.length > 0 ? sorted[sorted.length - 1].member : null;

  // Best triple
  const tripleResult = findBestTriple(members, allPairs);

  // MBTI distribution
  const mbtiDistribution: Record<string, number> = {};
  members.forEach(m => {
    mbtiDistribution[m.mbtiType] = (mbtiDistribution[m.mbtiType] || 0) + 1;
  });

  return {
    synergyScore,
    keyConnector: keyConnector !== isolationRisk ? keyConnector : keyConnector,
    isolationRisk: members.length > 1 ? isolationRisk : null,
    bestTriple: tripleResult?.triple ?? null,
    bestTripleScore: tripleResult?.score ?? 0,
    mbtiDistribution,
    gradeDistribution,
    totalPairs: allPairs.length,
  };
}

export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'S': return '#F59E0B';
    case 'A': return '#10B981';
    case 'B': return '#3B82F6';
    case 'C': return '#9CA3AF';
    case 'F': return '#EF4444';
  }
}

export function getGradeBgClass(grade: Grade): string {
  switch (grade) {
    case 'S': return 'bg-amber-100 text-amber-800';
    case 'A': return 'bg-emerald-100 text-emerald-800';
    case 'B': return 'bg-blue-100 text-blue-800';
    case 'C': return 'bg-gray-100 text-gray-600';
    case 'F': return 'bg-red-100 text-red-700';
  }
}
