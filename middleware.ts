import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Remove all middleware for now to avoid MIDDLEWARE_INVOCATION_FAILED errors
export function middleware(request: NextRequest) {
  // Do nothing, just pass through
  return NextResponse.next();
}

// Don't match any routes for now
export const config = {
  matcher: ["/none-for-now"],
};
