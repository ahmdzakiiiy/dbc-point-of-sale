// Simplified catch-all route to handle any API requests that don't match specific routes

// Helper function to create a standard 404 response
function createNotFoundResponse() {
  return new Response(
    JSON.stringify({ error: "Not found", status: 404 }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    }
  );
}

export function GET() {
  return createNotFoundResponse();
}

export function POST() {
  return createNotFoundResponse();
}

export function PUT() {
  return createNotFoundResponse();
}

export function DELETE() {
  return createNotFoundResponse();
}

export function PATCH() {
  return createNotFoundResponse();
}

export function OPTIONS() {
  return new Response(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
