import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}

// For API route security, basic check for username/password during development
// In production, use proper authentication with hashed passwords
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // First implementation: Check hardcoded credentials
    // In a real scenario, we'd use password hashing and proper auth
    if (username === "admin" && password === "password123") {
      // Check if user exists in Supabase
      const { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .limit(1);
      if (fetchError) {
        console.error("Error fetching user:", fetchError);
        return NextResponse.json(
          { error: "Kesalahan autentikasi" },
          { status: 500 }
        );
      }

      let userId;

      // If user doesn't exist yet, create it
      if (!existingUsers || existingUsers.length === 0) {
        // Create the user in Supabase for future reference
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              username: username,
              password: password, // Note: In production, never store plain text passwords
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user:", insertError);
          return NextResponse.json(
            { error: "Tidak dapat membuat pengguna" },
            { status: 500 }
          );
        }

        userId = newUser.id;
      } else {
        userId = existingUsers[0].id;
      }

      // Set cookie for server-side authorization
      const cookieStore = cookies();
      cookieStore.set("isLoggedIn", "true", { path: "/", maxAge: 86400 });
      cookieStore.set("username", username, { path: "/", maxAge: 86400 });
      cookieStore.set("userId", userId, { path: "/", maxAge: 86400 });      // Return user info for client-side use
      return NextResponse.json(
        {
          success: true,
          user: { username, id: userId },
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        }
      );
    } else {
      // Credentials don't match
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Autentikasi gagal" }, { status: 500 });
  }
}
