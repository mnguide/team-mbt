/**
 * Cloudflare Worker — LLM Proxy for Team MBTI AI Analysis
 *
 * Deploy: npx wrangler deploy
 * Set secrets: npx wrangler secret put ANTHROPIC_API_KEY
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface AnalysisRequest {
  myType: string;
  theirType: string;
  role: string;
  scenario: 'coaching' | 'team-analysis' | 'villain-sim';
  context?: string;
}

const SYSTEM_PROMPT = `당신은 한국 직장 문화 전문 코치입니다. MBTI 기반으로 직장인 간의 관계를 분석하고 실용적인 조언을 제공합니다.

규칙:
- 한국어로 답변
- 200~400자 이내로 간결하게
- 존댓말 사용
- 구체적이고 바로 실천 가능한 조언 위주
- 유머를 살짝 섞되 전문적인 톤 유지
- 실제 사용할 수 있는 대사/문구를 포함`;

const SCENARIO_PROMPTS: Record<string, string> = {
  coaching: '두 사람 사이에서 효과적인 대화법과 실전 대사를 추천해주세요. 복사해서 바로 사용할 수 있는 메시지 형태로 제공해주세요.',
  'team-analysis': '두 사람의 관계를 심층 분석하고, 갈등 예방책과 시너지 극대화 방안을 제시해주세요.',
  'villain-sim': '상대가 어려운 상황을 만들 때 대응할 수 있는 시나리오별 전략 3가지를 제시해주세요. 각 전략에 실전 대사를 포함해주세요.',
};

const CONTEXT_LABELS: Record<string, string> = {
  salary: '연봉 협상 상황',
  feedback: '피드백을 주는 상황',
  conflict: '갈등이 생긴 상황',
  request: '업무를 요청하는 상황',
  'passive-aggressive': '상대가 수동 공격적으로 나오는 상황',
  'credit-steal': '상대가 공을 가로채는 상황',
  micromanage: '상대가 마이크로매니징을 하는 상황',
  gossip: '상대가 뒷담화를 하는 상황',
  project: '프로젝트 배치 관점',
  leadership: '리더십 스타일 관점',
  growth: '성장 방향 관점',
  'conflict-prevention': '갈등 예방 관점',
};

const ROLE_LABELS: Record<string, string> = {
  leader: '상사 (리더)',
  peer: '동료',
  junior: '후배',
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 10;

  const timestamps = rateLimiter.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);

  if (recent.length >= maxRequests) return false;

  recent.push(now);
  rateLimiter.set(ip, recent);
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/analyze') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json() as AnalysisRequest;
      const { myType, theirType, role, scenario, context } = body;

      // Validate
      if (!myType || !theirType || !role || !scenario) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userPrompt = [
        `나의 MBTI: ${myType}`,
        `상대의 MBTI: ${theirType}`,
        `나의 역할: ${ROLE_LABELS[role] || role}`,
        `상황: ${CONTEXT_LABELS[context || ''] || context || '일반'}`,
        '',
        SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.coaching,
      ].join('\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', errText);
        return new Response(JSON.stringify({ error: 'AI 분석에 실패했어요.' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json() as {
        content: { type: string; text: string }[];
      };
      const resultText = data.content[0]?.text || '';

      return new Response(JSON.stringify({ result: resultText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: '서버 오류가 발생했어요.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
