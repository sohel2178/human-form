import { Ticket } from "@/database";
import dbConnect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const ticket_id = searchParams.get("ticket_id") || "";
    const token = searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    if (!ticket_id) {
      return NextResponse.json({ error: "Missing ticket_id" }, { status: 400 });
    }

    // ✅ Validate token
    if (token !== process.env.FORM_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const ticket = await Ticket.findOne({ ticket_id });
    if (!ticket) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({
      exists: true,
      ticket: {
        sender_id: ticket.sender_id,
        question: ticket.question,
        vehicle_type: ticket.vehicle_type,
        location: ticket.location,
        ticket_id: ticket.ticket_id,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
