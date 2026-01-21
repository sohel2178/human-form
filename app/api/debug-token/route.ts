import { NextResponse } from "next/server";

export async function GET() {
  const expected = process.env.FORM_ACCESS_TOKEN || "";

  return NextResponse.json({
    tokenExists: !!expected,
    tokenLength: expected.length,
    tokenStart: expected.slice(0, 6), // hf_9aB
    tokenEnd: expected.slice(-6), // last 6 chars
  });
}
