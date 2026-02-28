/**
 * Admin 邀请端点：批量为高质量用户创建访谈会话
 *
 * POST /api/interview/invite
 * Header: Authorization: Bearer <BETTER_AUTH_SECRET>
 * Body:
 *   { userIds: string[] }                  — 指定用户 ID 列表
 *   { criteria: "eligible", limit?: 500 }  — 按条件筛选（已完成问卷 + 已验证邮箱）
 *
 * Response: { created: number, interviews: { userId, inviteToken, inviteUrl }[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/server/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return unauthorized();
  }

  let body: {
    userIds?: string[];
    criteria?: string;
    limit?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let targetUserIds: string[] = [];

  if (body.userIds && Array.isArray(body.userIds)) {
    targetUserIds = body.userIds;
  } else if (body.criteria === "eligible") {
    const limit = Math.min(body.limit ?? 500, 2000);
    const eligible = await db.user.findMany({
      where: {
        emailVerified: true,
        surveyResponse: { completed: true, optedIn: true },
        interviews: { none: {} },
      },
      select: { id: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    targetUserIds = eligible.map((u) => u.id);
  } else {
    return NextResponse.json(
      { error: "Provide userIds[] or criteria:'eligible'" },
      { status: 400 },
    );
  }

  if (targetUserIds.length === 0) {
    return NextResponse.json({ created: 0, interviews: [] });
  }

  // Skip users who already have an active/completed interview
  const existing = await db.interview.findMany({
    where: { userId: { in: targetUserIds } },
    select: { userId: true },
  });
  const existingSet = new Set(existing.map((e) => e.userId));
  const newUserIds = targetUserIds.filter((id) => !existingSet.has(id));

  const baseUrl = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

  const created: { userId: string; inviteToken: string; inviteUrl: string }[] = [];

  // Batch create in chunks to avoid overwhelming the DB
  const CHUNK = 100;
  for (let i = 0; i < newUserIds.length; i += CHUNK) {
    const chunk = newUserIds.slice(i, i + CHUNK);
    const data = chunk.map((userId) => {
      const inviteToken = randomUUID();
      created.push({
        userId,
        inviteToken,
        inviteUrl: `${baseUrl}/interview?token=${inviteToken}`,
      });
      return { userId, inviteToken };
    });

    await db.interview.createMany({ data });
  }

  return NextResponse.json({
    created: created.length,
    skipped: existingSet.size,
    interviews: created,
  });
}
