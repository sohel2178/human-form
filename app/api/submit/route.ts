import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const expected = (process.env.FORM_ACCESS_TOKEN || "").trim();

    const normalizeToken = (t: string) =>
      (t || "")
        .trim()
        .replace(/\s+/g, "") // remove spaces/newline
        .replace(/_/g, ""); // Telegram removes underscores sometimes

    const receivedToken = normalizeToken(body.token);
    const expectedToken = normalizeToken(expected);

    if (!expected) {
      return NextResponse.json(
        { error: "Missing server token config" },
        { status: 500 },
      );
    }

    // ✅ token check (Telegram-safe)
    if (!receivedToken || receivedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // rest remains same...
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Missing N8N_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    const payload = {
      ...body,
      submittedAt: new Date().toISOString(),
    };

    const r = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error || "n8n webhook error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
