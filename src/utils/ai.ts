const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://team-mbti-ai.your-worker.workers.dev';

export type AiScenario = 'coaching' | 'team-analysis' | 'villain-sim';

interface AiRequest {
  myType: string;
  theirType: string;
  role: string;
  scenario: AiScenario;
  context?: string;
}

interface AiResponse {
  result: string;
  error?: string;
}

export async function requestAiAnalysis(params: AiRequest): Promise<AiResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      result: '',
      error: '분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    };
  }
}
