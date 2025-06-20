import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const environment = process.env.NODE_ENV || "development";
  
  try {
    // Test cookie functionality
    const cookieStore = cookies();
    cookieStore.set("health_check", "passed", { path: "/", maxAge: 60 }); // 1 minute expiry
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment,
      apiVersion: "1.0.0",
      cookieTest: "passed"
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      environment,
      message: error.message || "Unknown error",
      cookieTest: "failed"
    }, { status: 500 });
  }
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
    }
  );
}
