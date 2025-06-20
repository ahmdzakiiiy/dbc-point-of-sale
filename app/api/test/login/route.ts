// A simple test endpoint to diagnose API routing issues
export async function POST(request: Request) {
  try {
    return new Response(
      JSON.stringify({ 
        success: true, 
        method: "POST", 
        time: new Date().toISOString(),
        message: "Test endpoint is working"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    return new Response(
      JSON.stringify({ 
        success: true, 
        method: "GET", 
        time: new Date().toISOString(),
        message: "Test endpoint is working"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS", 
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
