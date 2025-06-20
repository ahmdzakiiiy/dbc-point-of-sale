import { NextResponse } from "next/server";

// A simple endpoint for diagnosing production issues
export async function GET() {
  // Capture environment details
  const diagnostics = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    platform: process.platform,
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    headers: {},
  };

  try {
    // Return a simple JSON response
    return NextResponse.json(diagnostics, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error: any) {
    console.error("Diagnostic error:", error);

    // Even if there's an error, still try to return JSON
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: error.message || "Unknown error",
        stack: error.stack || "No stack trace",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
