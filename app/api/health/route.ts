import { NextResponse } from "next/server";

export async function GET() {
  // Return the simplest possible JSON response
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
