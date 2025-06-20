// Ultra robust debugging API route with no external dependencies
// and detailed environment information

export function GET(request: Request) {
  try {
    // Collect as much debugging info as possible
    const info = {
      status: "ok",
      time: new Date().toISOString(),
      route: "/api/debug",
      
      // Environment info
      node_env: process.env.NODE_ENV || "unknown",
      vercel_env: process.env.VERCEL_ENV || "unknown",
      vercel_region: process.env.VERCEL_REGION || "unknown",
      
      // Request info
      request_url: request.url || "unknown",
      request_method: request.method || "unknown",
      request_headers: Object.fromEntries(
        Array.from(request.headers.entries())
          .filter(([key]) => !key.toLowerCase().includes("authorization"))
      ),
      
      // Server info
      runtime: typeof process !== "undefined" ? "node" : "unknown",
      node_version: process.version || "unknown",
      
      message: "This is a minimal debugging endpoint with no external dependencies"
    };

    // Return detailed info
    return new Response(JSON.stringify(info, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    // Catch all errors and return them as JSON
    const errorInfo = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      time: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorInfo, null, 2), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}
