import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/onboarding/survey?verified=invalid", req.url)
    );
  }

  const record = await db.verification.findFirst({
    where: {
      value: token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return NextResponse.redirect(
      new URL("/onboarding/survey?verified=expired", req.url)
    );
  }

  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: true },
  });

  await db.verification.delete({ where: { id: record.id } });

  return NextResponse.redirect(
    new URL("/onboarding/survey?verified=true", req.url)
  );
}
