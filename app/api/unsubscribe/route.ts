import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?success=false", req.url));
  }

  const subscriber = await db.subscriber.findUnique({ where: { unsubscribeToken: token } });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/unsubscribed?success=false", req.url));
  }

  await db.subscriber.update({
    where: { id: subscriber.id },
    data: { enabled: false },
  });

  return NextResponse.redirect(new URL("/unsubscribed?success=true", req.url));
}
