import { NextResponse } from "next/server";

// Catch-all route to handle any API requests that don't match specific routes
// This helps prevent 404 HTML pages which can break JSON parsing
export async function GET(
  request: Request,
  { params }: { params: { catch_all: string[] } }
) {
  const path = params.catch_all ? params.catch_all.join("/") : "root";

  return NextResponse.json(
    {
      error: `API endpoint not found: ${path}`,
      message: "This is a catch-all endpoint to prevent 404 HTML responses",
      status: 404,
    },
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function POST(
  request: Request,
  { params }: { params: { catch_all: string[] } }
) {
  return handleMethod(request, "POST", params);
}

export async function PUT(
  request: Request,
  { params }: { params: { catch_all: string[] } }
) {
  return handleMethod(request, "PUT", params);
}

export async function DELETE(
  request: Request,
  { params }: { params: { catch_all: string[] } }
) {
  return handleMethod(request, "DELETE", params);
}

export async function PATCH(
  request: Request,
  { params }: { params: { catch_all: string[] } }
) {
  return handleMethod(request, "PATCH", params);
}

export async function OPTIONS(request: Request) {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    }
  );
}

// Helper function to handle all HTTP methods
function handleMethod(
  request: Request,
  method: string,
  params: { catch_all: string[] }
) {
  const path = params.catch_all ? params.catch_all.join("/") : "root";

  return NextResponse.json(
    {
      error: `API endpoint not found: ${path}`,
      method: method,
      message: "This is a catch-all endpoint to prevent 404 HTML responses",
      status: 404,
    },
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
