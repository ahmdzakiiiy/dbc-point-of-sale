import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /api/auth/login)
  const path = request.nextUrl.pathname;

  // Only run this middleware for API routes
  if (path.startsWith("/api/")) {
    // Create a response with minimum headers
    const response = NextResponse.next();
    
    // Add CORS headers to the response - Keep this simple
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods", 
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle OPTIONS request for CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    return response;
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: "/api/:path*",
};
