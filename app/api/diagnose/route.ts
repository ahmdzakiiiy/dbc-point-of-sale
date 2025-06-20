import { NextResponse } from "next/server";

// A simple endpoint for diagnosing production issues
export async function GET() {
  // Return a very simple response to avoid any potential issues
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "unknown"
  });
}

export async function OPTIONS() {
  return NextResponse.json({ status: "ok" });
}
