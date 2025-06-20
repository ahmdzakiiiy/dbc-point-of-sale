import { NextResponse } from "next/server";

// Simplified catch-all route to handle any API requests that don't match specific routes
export async function GET() {
  return NextResponse.json({ error: "Not found", status: 404 }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Not found", status: 404 }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ error: "Not found", status: 404 }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Not found", status: 404 }, { status: 404 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Not found", status: 404 }, { status: 404 });
}

export async function OPTIONS() {
  return NextResponse.json({ status: "ok" });
}
