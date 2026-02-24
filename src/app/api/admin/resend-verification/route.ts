import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { sendConfirmationEmail } from "@/server/email/send-confirmation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.BETTER_AUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const emailFilter: string[] | undefined = body.emails;

  const unverifiedUsers = await db.user.findMany({
    where: {
      emailVerified: false,
      ...(emailFilter ? { email: { in: emailFilter } } : {}),
    },
    include: { profile: { select: { displayName: true } } },
  });

  const baseUrl =
    (process.env.BETTER_AUTH_URL || "http://localhost:3000").trim();

  const results: {
    email: string;
    status: "sent" | "failed";
    error?: string;
  }[] = [];

  for (const user of unverifiedUsers) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verification.create({
      data: {
        identifier: user.email,
        value: token,
        expiresAt,
      },
    });

    const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;
    const displayName = user.profile?.displayName || user.name || "User";

    try {
      await sendConfirmationEmail({
        toEmail: user.email,
        displayName,
        verifyUrl,
      });
      results.push({ email: user.email, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ email: user.email, status: "failed", error: message });
    }

    await sleep(600);
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    total: unverifiedUsers.length,
    sent,
    failed,
    results,
  });
}
