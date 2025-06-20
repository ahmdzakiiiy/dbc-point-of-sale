import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /api/auth/login)
  const path = request.nextUrl.pathname;

  // Only run this middleware for API routes
  if (path.startsWith("/api/")) {
    // Clone the request headers
    const requestHeaders = new Headers(request.headers);

    // Ensure Accept header is set for JSON
    if (
      !requestHeaders.has("Accept") ||
      requestHeaders.get("Accept") === "*/*"
    ) {
      requestHeaders.set("Accept", "application/json");
    }

    // Set explicit content-type expectations
    if (request.method === "POST" || request.method === "PUT") {
      requestHeaders.set("Content-Type", "application/json");
    }

    const response = NextResponse.next({
      request: {
        // Apply new request headers
        headers: requestHeaders,
      },
    });

    // Add CORS headers to the response
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Content-Type", "application/json");

    // Handle OPTIONS request for CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    // Log access for debugging
    const environment = process.env.NODE_ENV || "development";
    console.log(
      `[${environment}] API Route accessed: ${path}, Method: ${request.method}`
    );
    return response;
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: "/api/:path*",
};
