import { NextResponse } from "next/server";

// A simple test endpoint to diagnose API routing issues
export async function POST(request: Request) {
  try {
    const body = await request.json();

    return NextResponse.json({
      received: body,
      method: "POST",
      timestamp: new Date().toISOString(),
      success: true,
    });
  } catch (error: any) {
    console.error("Test login error:", error);

    return NextResponse.json(
      {
        error: error.message || "Unknown error",
        method: "POST",
        timestamp: new Date().toISOString(),
        success: false,
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "This endpoint requires a POST request",
    method: "GET",
    timestamp: new Date().toISOString(),
  });
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
