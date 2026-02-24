import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/email-verified?status=invalid", req.url)
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
      new URL("/email-verified?status=expired", req.url)
    );
  }

  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: true },
  });

  return NextResponse.redirect(
    new URL("/email-verified?status=success", req.url)
  );
}
