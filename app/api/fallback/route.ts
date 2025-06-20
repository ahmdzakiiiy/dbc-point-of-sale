// Super simple fallback API endpoint that should work in any environment
// This is for testing when other endpoints fail

export async function GET() {
  // Use the raw Response API - most basic approach possible
  return new Response('{"status":"ok","message":"Fallback API working"}', {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function OPTIONS() {
  // Simple OPTIONS response
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
