import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

// Handle OPTIONS request for CORS
export function OPTIONS() {
  return new Response(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// For API route security, basic check for username/password during development
// In production, use proper authentication with hashed passwords
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username, password } = body;

    // First implementation: Check hardcoded credentials
    // In a real scenario, we'd use password hashing and proper auth
    if (username === "admin" && password === "password123") {
      try {
        // Check if user exists in Supabase
        const { data: existingUsers, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .limit(1);

        if (fetchError) {
          console.error("Error fetching user:", fetchError);
          return new Response(
            JSON.stringify({ error: "Kesalahan autentikasi" }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            }
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
            return new Response(
              JSON.stringify({ error: "Tidak dapat membuat pengguna" }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods": "POST, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
              }
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
        cookieStore.set("userId", userId, { path: "/", maxAge: 86400 });

        // Return user info for client-side use
        return new Response(
          JSON.stringify({
            success: true,
            user: { username, id: userId },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        return new Response(
          JSON.stringify({ error: "Database error: " + dbError.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }
    } else {
      // Credentials don't match
      return new Response(
        JSON.stringify({ error: "Username atau password salah" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Autentikasi gagal: " + error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
