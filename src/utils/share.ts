export async function shareResult(title: string, text: string, url?: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'share' as const };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'none' as const };
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text + (url ? `\n${url}` : ''));
    return { success: true, method: 'copy' as const };
  } catch {
    return { success: false, method: 'none' as const };
  }
}

export function generateShareText(
  type: 'card' | 'chemistry' | 'team',
  data: Record<string, string>
): string {
  switch (type) {
    case 'card':
      return `🏢 나의 K-직장인 유형: ${data.emoji} ${data.title}\n"${data.subtitle}"\n\n나도 테스트하기 👉`;
    case 'chemistry':
      return `💼 직장 궁합 결과: ${data.grade}등급!\n${data.myType} × ${data.theirType}\n"${data.synergy}"\n\n너도 해봐 👉`;
    case 'team':
      return `📊 팀MBTI - 우리 팀 케미 보고서\n${data.emoji} ${data.teamType}\n"${data.description}"\n\n우리 팀도 분석해보기 👉`;
    default:
      return '';
  }
}
