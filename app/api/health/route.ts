import { NextResponse } from "next/server";

// A very simple health check endpoint
export async function GET(request: Request) {
  try {
    // Generate a simple response with no dependencies on complex functions
    return new Response(
      JSON.stringify({ status: "ok", time: new Date().toISOString() }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );
  } catch (error) {
    console.error("Health endpoint error:", error);
    // Return a very basic response that should work no matter what
    return new Response('{"status":"error"}', {
      status: 200,
      headers: {"Content-Type": "application/json"}
    });
  }
}

// Simple OPTIONS handler
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
