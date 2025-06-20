import { NextResponse } from "next/server";

// A simple test endpoint to diagnose API routing issues
export async function POST() {
  return NextResponse.json({ success: true, method: "POST" });
}

export async function GET() {
  return NextResponse.json({ success: true, method: "GET" });
}

export async function OPTIONS() {
  return NextResponse.json({ success: true });
}
