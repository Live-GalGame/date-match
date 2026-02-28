/**
 * OpenAI-compatible LLM 调用工具。
 * 支持独立的 INTERVIEW_* 环境变量，降级到 LLM_* 通用变量。
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getConfig(): LLMConfig | null {
  const apiKey = process.env.INTERVIEW_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl:
      (process.env.INTERVIEW_BASE_URL || process.env.LLM_BASE_URL || "https://api.openai.com").replace(/\/+$/, ""),
    model:
      process.env.INTERVIEW_MODEL || process.env.LLM_MODEL || "gpt-4o-mini",
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string | null> {
  const config = getConfig();
  if (!config) {
    console.error("[Interview LLM] No API key configured (INTERVIEW_API_KEY or LLM_API_KEY)");
    return null;
  }

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.85,
      max_tokens: options?.maxTokens ?? 1200,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[Interview LLM] API error ${response.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return json.choices?.[0]?.message?.content?.trim() ?? null;
}
