import typesData from '../data/types.json';
import chemistryData from '../data/chemistry.json';

export type MbtiType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export type Role = 'leader' | 'peer' | 'junior';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'F';

export const MBTI_TYPES: MbtiType[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

export interface TypeInfo {
  title: string;
  emoji: string;
  subtitle: string;
  description: string;
  workStyle: string;
  commStyle: string;
  landmine: string;
  strength: string;
  weakness: string;
  lunchStyle: string;
  slackStyle: string;
  survivalTip: string;
}

export interface ChemistryResult {
  score: number;
  grade: Grade;
  gradeLabel: string;
  synergy: string;
  conflict: string;
  tip: string;
  specialTip?: string;
  roleTip: string;
}

export function getTypeInfo(type: MbtiType): TypeInfo {
  return typesData[type] as TypeInfo;
}

function getAxisKey(a: string, b: string): string {
  if (a === b) return `${a}-${a}`;
  // Normalize: E before I, S before N, T before F, J before P
  const order = 'EISNTFJP';
  return order.indexOf(a) < order.indexOf(b) ? `${a}-${b}` : `${b}-${a}`;
}

function getAxisScore(a: string, b: string): number {
  // Same type on axis = moderate compatibility
  // Complementary = could be great or challenging
  const sameAxisBonus: Record<string, number> = {
    'E-E': 60, 'I-I': 65, 'E-I': 55,
    'S-S': 65, 'N-N': 60, 'S-N': 50,
    'T-T': 55, 'F-F': 60, 'T-F': 70,
    'J-J': 55, 'P-P': 50, 'J-P': 65,
  };
  const key = getAxisKey(a, b);
  return sameAxisBonus[key] ?? 50;
}

export function calculateChemistry(
  myType: MbtiType,
  theirType: MbtiType,
  role: Role
): ChemistryResult {
  const overrideKey1 = `${myType}-${theirType}`;
  const overrideKey2 = `${theirType}-${myType}`;
  const overrides = chemistryData.overrides as Record<string, {
    grade: Grade;
    score: number;
    synergy: string;
    conflict: string;
    specialTip: string;
  }>;
  const override = overrides[overrideKey1] || overrides[overrideKey2];

  let score: number;
  let synergy: string;
  let conflict: string;
  let specialTip: string | undefined;

  if (override) {
    score = override.score;
    synergy = override.synergy;
    conflict = override.conflict;
    specialTip = override.specialTip;
  } else {
    // Calculate from axis templates
    const axes = [
      { a: myType[0], b: theirType[0] }, // E/I
      { a: myType[1], b: theirType[1] }, // S/N
      { a: myType[2], b: theirType[2] }, // T/F
      { a: myType[3], b: theirType[3] }, // J/P
    ];

    const axisScores = axes.map(({ a, b }) => getAxisScore(a, b));
    score = Math.round(axisScores.reduce((sum, s) => sum + s, 0) / 4);

    // Get templates for most impactful axes
    const templates = chemistryData.axisTemplates as Record<string, {
      synergy: string;
      conflict: string;
      tip: string;
    }>;

    // Pick the axis with most tension (lowest score) for conflict
    const tfAxis = getAxisKey(myType[2], theirType[2]);
    const eiAxis = getAxisKey(myType[0], theirType[0]);

    synergy = templates[eiAxis]?.synergy || '서로의 다름이 시너지가 될 수 있는 관계';
    conflict = templates[tfAxis]?.conflict || '소통 방식의 차이에 주의하세요';
  }

  // Determine grade
  const thresholds = chemistryData.gradeThresholds as Record<string, number>;
  const labels = chemistryData.gradeLabels as Record<string, string>;
  let grade: Grade = 'F';
  for (const g of ['S', 'A', 'B', 'C', 'F'] as Grade[]) {
    if (score >= thresholds[g]) {
      grade = g;
      break;
    }
  }

  // Role-based tip
  const roleData = chemistryData.roleModifiers[role];
  const theirInfo = getTypeInfo(theirType);
  let roleTip: string;

  if (role === 'leader') {
    if (theirType[2] === 'F') {
      roleTip = `${roleData.prefix} 피드백은 부드럽게 전달하세요. ${theirInfo.commStyle}`;
    } else {
      roleTip = `${roleData.prefix} 논리적 근거와 함께 지시하면 효과적입니다.`;
    }
  } else if (role === 'junior') {
    if (theirType[3] === 'J') {
      roleTip = `${roleData.prefix} 보고는 결론부터, 정해진 형식을 지키세요.`;
    } else {
      roleTip = `${roleData.prefix} 유연하게 접근하되 핵심은 빠뜨리지 마세요.`;
    }
  } else {
    if (theirType[0] === 'I') {
      roleTip = `${roleData.prefix} 1:1로 소통하고 혼자 시간을 존중해주세요.`;
    } else {
      roleTip = `${roleData.prefix} 에너지 맞춰주면 좋은 동료가 됩니다.`;
    }
  }

  return {
    score,
    grade,
    gradeLabel: labels[grade],
    synergy,
    conflict,
    tip: specialTip || roleTip,
    specialTip,
    roleTip,
  };
}

export function inferMbtiFromScores(scores: Record<string, number>): MbtiType {
  const e = scores['E'] || 0;
  const i = scores['I'] || 0;
  const s = scores['S'] || 0;
  const n = scores['N'] || 0;
  const t = scores['T'] || 0;
  const f = scores['F'] || 0;
  const j = scores['J'] || 0;
  const p = scores['P'] || 0;

  const type = [
    e >= i ? 'E' : 'I',
    s >= n ? 'S' : 'N',
    t >= f ? 'T' : 'F',
    j >= p ? 'J' : 'P',
  ].join('') as MbtiType;

  return type;
}

export function getConfidenceLevel(scores: Record<string, number>): number {
  const pairs = [
    [scores['E'] || 0, scores['I'] || 0],
    [scores['S'] || 0, scores['N'] || 0],
    [scores['T'] || 0, scores['F'] || 0],
    [scores['J'] || 0, scores['P'] || 0],
  ];

  const diffs = pairs.map(([a, b]) => Math.abs(a - b) / (a + b + 1));
  const avgDiff = diffs.reduce((sum, d) => sum + d, 0) / 4;

  return Math.min(Math.round(avgDiff * 100 + 50), 99);
}

export function determineTeamType(types: MbtiType[]): typeof chemistryData.teamTypes[number] {
  if (types.length === 0) return chemistryData.teamTypes[chemistryData.teamTypes.length - 1];

  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  types.forEach(type => {
    counts[type[0] as keyof typeof counts]++;
    counts[type[1] as keyof typeof counts]++;
    counts[type[2] as keyof typeof counts]++;
    counts[type[3] as keyof typeof counts]++;
  });

  const total = types.length;
  const pct = (key: string) => (counts[key as keyof typeof counts] / total) * 100;

  // Check conditions in order
  if (pct('T') >= 60 && pct('J') >= 50) return chemistryData.teamTypes[0]; // battle
  if (pct('F') >= 60 && pct('I') >= 50) return chemistryData.teamTypes[1]; // healing
  if (pct('P') >= 60 && pct('E') >= 50) return chemistryData.teamTypes[2]; // chaos
  if (pct('N') >= 60 && pct('T') >= 50) return chemistryData.teamTypes[3]; // think-tank
  if (pct('F') >= 60 && pct('E') >= 50) return chemistryData.teamTypes[4]; // family
  if (pct('S') >= 60 && pct('J') >= 50) return chemistryData.teamTypes[5]; // machine

  return chemistryData.teamTypes[6]; // balanced
}
