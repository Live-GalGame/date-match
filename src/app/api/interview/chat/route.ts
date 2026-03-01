/**
 * 深度访谈 Chat API
 *
 * GET  ?token=xxx  — 获取当前会话状态（消息历史、轮次、状态）
 * POST { token, message } — 发送一条用户消息，返回 AI 回复
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { chatCompletion, type ChatMessage } from "@/server/interview/llm";
import {
  buildInterviewSystemPrompt,
  MAX_INTERVIEW_TURNS,
  INTERVIEW_COMPLETE_MARKER,
  parseSuggestedReplies,
} from "@/server/interview/prompts";
import { formatSurveyContext } from "@/server/interview/format-context";
import { extractInterviewProfile } from "@/server/interview/extract";

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

async function loadInterview(token: string) {
  return db.interview.findUnique({
    where: { inviteToken: token },
    include: {
      user: {
        include: {
          surveyResponse: true,
          profile: true,
        },
      },
    },
  });
}

function buildSurveyContext(interview: NonNullable<Awaited<ReturnType<typeof loadInterview>>>): string {
  if (!interview.user.surveyResponse) return "(该用户无问卷数据)";
  const answers = JSON.parse(interview.user.surveyResponse.answers) as Record<
    string,
    string | number | string[]
  >;

  let context = formatSurveyContext(answers);

  const p = interview.user.profile;
  if (p) {
    const profileLines: string[] = [];
    if (p.gender) profileLines.push(`性别：${p.gender}`);
    if (p.age > 0) profileLines.push(`年龄：${p.age}`);
    if (p.education) profileLines.push(`学历：${p.education}`);
    if (p.school) profileLines.push(`学校：${p.school}`);
    if (profileLines.length > 0) {
      context = `【基本信息】\n${profileLines.join("、")}\n\n${context}`;
    }
  }

  return context;
}

// ─── GET: Fetch session state (auto-generates opening if new) ───

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const interview = await loadInterview(token);
  if (!interview) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const storedMessages = JSON.parse(interview.messages) as StoredMessage[];
  const userName = interview.user.name ?? interview.user.profile?.displayName ?? "";

  // New session with no messages — generate the AI's opening proactively
  if (storedMessages.length === 0 && interview.status === "active") {
    const surveyContext = buildSurveyContext(interview);
    const systemPrompt = buildInterviewSystemPrompt(surveyContext);

    const opening = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "[系统：用户刚进入访谈页面，请发送你的开场白。]" },
      ],
      { temperature: 0.9, maxTokens: 600 },
    );

    if (opening) {
      const rawContent = opening.replace(INTERVIEW_COMPLETE_MARKER, "").trim();
      const { cleanText, suggestedReplies } = parseSuggestedReplies(rawContent);
      const now = new Date().toISOString();
      const assistantMsg: StoredMessage = { role: "assistant", content: rawContent, ts: now };

      await db.interview.update({
        where: { id: interview.id },
        data: { messages: JSON.stringify([assistantMsg]) },
      });

      return NextResponse.json({
        id: interview.id,
        status: "active",
        turnCount: 0,
        messages: [{ role: "assistant", content: cleanText }],
        suggestedReplies,
        userName,
      });
    }
  }

  // Existing session — parse suggested replies from last assistant message
  let suggestedReplies: string[] = [];
  const lastAssistant = [...storedMessages].reverse().find((m) => m.role === "assistant");
  if (lastAssistant) {
    const parsed = parseSuggestedReplies(lastAssistant.content);
    suggestedReplies = parsed.suggestedReplies;
  }

  return NextResponse.json({
    id: interview.id,
    status: interview.status,
    turnCount: interview.turnCount,
    messages: storedMessages.map((m) => ({
      role: m.role,
      content: m.role === "assistant" ? parseSuggestedReplies(m.content).cleanText : m.content,
    })),
    suggestedReplies,
    userName,
  });
}

// ─── POST: Send message & get reply ───

export async function POST(request: NextRequest) {
  let body: { token?: string; message?: string };
  try {
    body = (await request.json()) as { token?: string; message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, message } = body;
  if (!token || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "token and message are required" }, { status: 400 });
  }

  const interview = await loadInterview(token);
  if (!interview) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (interview.status !== "active") {
    return NextResponse.json({
      error: "Interview already completed",
      status: interview.status,
    }, { status: 400 });
  }

  const storedMessages = JSON.parse(interview.messages) as StoredMessage[];
  const surveyContext = buildSurveyContext(interview);
  const systemPrompt = buildInterviewSystemPrompt(surveyContext);

  // Build LLM message history
  const llmMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const m of storedMessages) {
    llmMessages.push({ role: m.role, content: m.content });
  }

  llmMessages.push({ role: "user", content: message.trim() });

  // If we're near the turn limit, add a nudge
  const newTurnCount = interview.turnCount + 1;
  if (newTurnCount >= MAX_INTERVIEW_TURNS) {
    llmMessages.push({
      role: "system",
      content: `[内部提示：这是第 ${newTurnCount} 轮对话，请在本轮开始收束——复述你对用户的理解，确认雷区，温暖致谢并结束。在最后一条消息末尾加上 ${INTERVIEW_COMPLETE_MARKER}]`,
    });
  }

  const reply = await chatCompletion(llmMessages, {
    temperature: 0.85,
    maxTokens: 800,
  });

  if (!reply) {
    return NextResponse.json({ error: "LLM service unavailable" }, { status: 503 });
  }

  const isComplete = reply.includes(INTERVIEW_COMPLETE_MARKER) || newTurnCount >= MAX_INTERVIEW_TURNS + 1;
  const rawContent = reply.replace(INTERVIEW_COMPLETE_MARKER, "").trim();
  const { cleanText, suggestedReplies } = parseSuggestedReplies(rawContent);

  const now = new Date().toISOString();
  const userMsg: StoredMessage = { role: "user", content: message.trim(), ts: now };
  const assistantMsg: StoredMessage = { role: "assistant", content: rawContent, ts: now };

  const updatedMessages = [...storedMessages, userMsg, assistantMsg];
  const newStatus = isComplete ? "completed" : "active";

  await db.interview.update({
    where: { id: interview.id },
    data: {
      messages: JSON.stringify(updatedMessages),
      turnCount: newTurnCount,
      status: newStatus,
    },
  });

  if (isComplete) {
    extractInterviewProfile(interview.id).catch((err) => {
      console.error(`[Interview] Auto-extraction failed for ${interview.id}:`, err);
    });
  }

  return NextResponse.json({
    reply: cleanText,
    turnCount: newTurnCount,
    isComplete,
    suggestedReplies: isComplete ? [] : suggestedReplies,
  });
}
