import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { wantsJson } from "@/lib/http";
import { sendConfirmationEmail } from "@/lib/mail/digest";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const { email } = bodySchema.parse(raw);

    const subscriber = await db.subscriber.upsert({
      where: { email },
      update: { enabled: true },
      create: { email, enabled: true },
    });

    await sendConfirmationEmail(subscriber.email, subscriber.unsubscribeToken);

    return NextResponse.json({ ok: true, unsubscribeToken: subscriber.unsubscribeToken });
  } catch (error) {
    if (!wantsJson(req)) {
      return NextResponse.redirect(new URL("/?subscribe=failed", req.url));
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
