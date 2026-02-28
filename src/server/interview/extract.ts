/**
 * 后处理提炼管线：对话结束后，调用 LLM 从完整对话中提取结构化画像。
 */

import { db } from "@/server/db";
import { chatCompletion } from "./llm";
import { buildExtractionPrompt } from "./prompts";
import { formatSurveyContext } from "./format-context";

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

export interface ExtractionResult {
  self_portrait: string;
  ideal_partner: string;
  deal_breakers: string[];
  attachment_style: { type: string; evidence: string };
  love_language: { primary: string; secondary?: string; evidence: string };
  conflict_pattern: { type: string; evidence: string };
  emotional_needs_priority: string[];
  unmet_needs: string[];
  key_quotes: string[];
}

function formatConversation(messages: StoredMessage[]): string {
  return messages
    .map((m) => `${m.role === "user" ? "【用户】" : "【访谈师】"}${m.content}`)
    .join("\n\n");
}

export async function extractInterviewProfile(interviewId: string): Promise<ExtractionResult | null> {
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: {
      user: {
        include: { surveyResponse: true },
      },
    },
  });

  if (!interview) {
    console.error(`[Extract] Interview ${interviewId} not found`);
    return null;
  }

  const messages = JSON.parse(interview.messages) as StoredMessage[];
  if (messages.length === 0) {
    console.error(`[Extract] Interview ${interviewId} has no messages`);
    return null;
  }

  const conversation = formatConversation(messages);

  let surveyContext = "(该用户无问卷数据)";
  if (interview.user.surveyResponse) {
    const answers = JSON.parse(interview.user.surveyResponse.answers) as Record<
      string,
      string | number | string[]
    >;
    surveyContext = formatSurveyContext(answers);
  }

  const prompt = buildExtractionPrompt(conversation, surveyContext);

  const raw = await chatCompletion(
    [{ role: "user", content: prompt }],
    { temperature: 0.3, maxTokens: 3000 },
  );

  if (!raw) {
    console.error(`[Extract] LLM returned null for interview ${interviewId}`);
    return null;
  }

  // Strip markdown fences if LLM wraps output in ```json ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  let result: ExtractionResult;
  try {
    result = JSON.parse(cleaned) as ExtractionResult;
  } catch (err) {
    console.error(`[Extract] Failed to parse JSON for interview ${interviewId}:`, err);
    console.error(`[Extract] Raw LLM output:\n${raw.slice(0, 500)}`);
    return null;
  }

  await db.interview.update({
    where: { id: interviewId },
    data: {
      status: "extracted",
      selfPortrait: result.self_portrait,
      idealPartner: result.ideal_partner,
      extraction: JSON.stringify(result),
    },
  });

  return result;
}
