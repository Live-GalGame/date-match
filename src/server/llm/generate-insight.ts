import type { MatchResult } from "@/server/matching/algorithm";

interface SurveyAnswers {
  [key: string]: string | number | string[];
}

interface InsightInput {
  user1Answers: SurveyAnswers;
  user2Answers: SurveyAnswers;
  result: MatchResult;
}

const ANIMAL_LABELS: Record<string, string> = {
  A: "刺猬（保护型）",
  B: "鸵鸟（回避型）",
  C: "海豚（沟通型）",
  D: "章鱼（分析型）",
  E: "树懒（深思型）",
};

const SAFETY_LABELS: Record<string, string> = {
  A: "事事有回应",
  B: "绝对的后盾",
  C: "自由的牵挂",
  D: "进步的战友",
};

function buildPrompt(input: InsightInput): string {
  const { user1Answers: a, user2Answers: b, result } = input;

  const fmt = (answers: SurveyAnswers) => {
    const lines: string[] = [];
    if (answers.conflict_animal)
      lines.push(`冲突风格：${ANIMAL_LABELS[answers.conflict_animal as string] ?? answers.conflict_animal}`);
    if (answers.safety_source)
      lines.push(`安全感来源：${SAFETY_LABELS[answers.safety_source as string] ?? answers.safety_source}`);
    if (typeof answers.intimacy_warmth === "number")
      lines.push(`温存需求：${answers.intimacy_warmth}/10`);
    if (typeof answers.intimacy_passion === "number")
      lines.push(`激情需求：${answers.intimacy_passion}/10`);
    if (answers.attraction_points)
      lines.push(`吸引力说明书：${answers.attraction_points}`);
    if (answers.growth_invitation)
      lines.push(`成长邀请函：${answers.growth_invitation}`);
    if (answers.relationship_food)
      lines.push(`关系食物比喻：${answers.relationship_food}`);
    if (answers.core_principle)
      lines.push(`核心原则：${answers.core_principle}`);
    if (answers.economic_role)
      lines.push(`经济角色偏好：${answers.economic_role}`);
    return lines.join("\n");
  };

  return `你是一位经验丰富的关系心理咨询师，同时也是一位温暖且极具洞察力的红娘。
请根据两位用户的心理学问卷数据，为他们撰写专属的「AI 牵线语」。

【用户 A】
${fmt(a)}

【用户 B】
${fmt(b)}

【系统初筛结果】
兼容度：${result.compatibility}%
规则匹配理由：${result.reasons.join("；")}

请你：
1. 用温暖且有洞察力的语气，写一段 80-120 字的「牵线语」，指出他们之间最有趣的灵魂碰撞点。不要罗列数据，要讲故事。
2. 基于他们的问卷内容，给出一个具体的破冰话题建议（一句话，要足够具体到他们俩能聊起来）。

严格按以下格式输出（不要加 JSON 或 markdown 格式）：
牵线语：...
破冰话题：...`;
}

export interface MatchInsight {
  narrative: string;
  icebreaker: string;
}

export async function generateMatchInsight(
  user1Answers: SurveyAnswers,
  user2Answers: SurveyAnswers,
  result: MatchResult,
): Promise<MatchInsight | null> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) return null;

  const prompt = buildPrompt({ user1Answers, user2Answers, result });

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error(`[LLM] API error: ${response.status} ${response.statusText}`);
    return null;
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  const narrativeMatch = text.match(/牵线语[：:](.+?)(?=破冰话题|$)/);
  const icebreakerMatch = text.match(/破冰话题[：:](.+)/);

  return {
    narrative: narrativeMatch?.[1]?.trim() || text,
    icebreaker: icebreakerMatch?.[1]?.trim() || "",
  };
}
