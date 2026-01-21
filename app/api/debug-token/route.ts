import { NextResponse } from "next/server";

export async function GET() {
  const expected = process.env.FORM_ACCESS_TOKEN || "";
  return NextResponse.json({ expected });
}
