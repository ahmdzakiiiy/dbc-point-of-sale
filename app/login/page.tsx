"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Bug, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiInfo, setApiInfo] = useState<string>("");
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError("Username minimal 3 karakter");
    } else {
      setUsernameError("");
    }
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError("Password minimal 8 karakter");
    } else {
      setPasswordError("");
    }
  };  // Diagnostic function to test all endpoints
  const runDiagnostics = async () => {
    setApiInfo("Running diagnostics...");
    let results = [];
    
    try {        // Test Health Endpoint - Even simpler to avoid any parsing
        results.push("Checking /api/health endpoint...");
        try {
          const healthResponse = await fetch("/api/health", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Cache-Control": "no-cache"
            }
          });
          results.push(`Health API Status: ${healthResponse.status}`);
          
          try {
            const healthText = await healthResponse.text();
            if (healthText.includes("<!DOCTYPE html>")) {
              results.push("Health API returning HTML instead of JSON");
              results.push(`HTML snippet: ${healthText.substring(0, 150)}...`);
            } else {
              results.push(`Health API Response: ${healthText}`);
            }
          } catch (textErr) {
            results.push(`Health API text extraction error: ${textErr}`);
          }
        } catch (err: any) {
          results.push(`Health API fetch ERROR: ${err.message}`);
        }        // Test Alternative Login Endpoint - Use GET instead of POST as it's simpler
        results.push("Checking /api/test/login endpoint...");
        try {
          const testLoginResponse = await fetch("/api/test/login", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Cache-Control": "no-cache"
            }
          });
          results.push(`Test Login API Status: ${testLoginResponse.status}`);
          
          try {
            const testLoginText = await testLoginResponse.text();
            if (testLoginText.includes("<!DOCTYPE html>")) {
              results.push("Test Login API returning HTML instead of JSON");
              results.push(`HTML snippet: ${testLoginText.substring(0, 150)}...`);
            } else {
              results.push(`Test Login API Response: ${testLoginText}`);
            }
          } catch (textErr) {
            results.push(`Test Login API text extraction error: ${textErr}`);
          }
        } catch (err: any) {
          results.push(`Test Login API fetch ERROR: ${err.message}`);
        }

        // Test Real Login Endpoint with OPTIONS
        results.push("Checking /api/auth/login OPTIONS...");
        try {
          const optionsResponse = await fetch("/api/auth/login", {
            method: "OPTIONS",
          });
          results.push(`Login OPTIONS Status: ${optionsResponse.status}`);
          
          // Get response as text first
          const optionsText = await optionsResponse.text();
          results.push(`Login OPTIONS Response: ${optionsText.substring(0, 100)}`);
        } catch (err: any) {
          results.push(`Login OPTIONS ERROR: ${err.message}`);
        }        // Test fallback endpoint
        results.push("Checking /api/fallback endpoint...");
        try {
          const fallbackResponse = await fetch("/api/fallback", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Cache-Control": "no-cache"
            }
          });
          results.push(`Fallback API Status: ${fallbackResponse.status}`);
          
          try {
            const fallbackText = await fallbackResponse.text();
            if (fallbackText.includes("<!DOCTYPE html>")) {
              results.push("Fallback API returning HTML instead of JSON");
              results.push(`HTML snippet: ${fallbackText.substring(0, 150)}...`);
            } else {
              results.push(`Fallback API Response: ${fallbackText}`);
            }
          } catch (textErr) {
            results.push(`Fallback API text extraction error: ${textErr}`);
          }
        } catch (err: any) {
          results.push(`Fallback API fetch ERROR: ${err.message}`);
        }

        // Display environment info
        results.push(`Environment: ${process.env.NODE_ENV}`);
        results.push(`Hostname: ${window.location.hostname}`);
        results.push(`Protocol: ${window.location.protocol}`);
        results.push(`User Agent: ${navigator.userAgent.substring(0, 100)}`);

        // Set the results
        setApiInfo(results.join("\n"));
    } catch (error: any) {
      setApiInfo(`Diagnostic error: ${error.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    // Validate before submission
    validateUsername(username);
    validatePassword(password);

    // Only proceed if no validation errors
    if (username.length >= 3 && password.length >= 8) {      try {
        console.log("Attempting to login with username:", username);

        // Call our API endpoint
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          cache: "no-store",
        });

        console.log("Login response status:", response.status);

        if (response.status === 405) {
          throw new Error("API route method not allowed. Check server configuration.");
        }

        // Check for empty response
        const responseText = await response.text();
        if (!responseText) {
          throw new Error("Empty response received from server");
        }

        // Check if we received HTML instead of JSON (common error in production)
        if (responseText.trim().startsWith("<!DOCTYPE html>") || responseText.includes("<html")) {
          console.error("Received HTML instead of JSON");
          
          // Extract title if possible to help diagnose
          const titleMatch = responseText.match(/<title>(.*?)<\/title>/);
          const errorTitle = titleMatch ? titleMatch[1] : "Unknown error page";
          
          throw new Error(
            `Server returned HTML instead of JSON. Error page: ${errorTitle}`
          );
        }

        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          // Log the first part of the response to help diagnose
          console.error("Response start:", responseText.substring(0, 200));
          throw new Error(
            `Invalid JSON response: ${responseText.substring(0, 100)}...`
          );
        }

        if (response.ok) {
          // Use the auth context to manage login state
          login(username, data.user.id);

          // API route will set the cookies for us
          console.log("Login successful, user ID:", data.user.id);

          // Log successful connection to Supabase
          const { data: connectionTest, error: connectionError } =
            await supabase.from("users").select("id").limit(1);

          console.log(
            "Supabase connection test:",
            connectionTest ? "Success" : "Failed",
            connectionError
          );

          router.push("/dashboard");
        } else {
          // Pastikan tidak ada data autentikasi yang tersisa
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");

          // Clear cookies
          document.cookie = "isLoggedIn=; path=/; max-age=0";
          document.cookie = "username=; path=/; max-age=0";
          document.cookie = "userId=; path=/; max-age=0";

          setLoginError(
            data.error || "Username atau password salah. Silakan coba lagi."
          );
        }
      } catch (error: any) {
        console.error("Login error:", error);
        // Pastikan tidak ada data autentikasi yang tersisa jika terjadi error
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");

        // Clear cookies
        document.cookie = "isLoggedIn=; path=/; max-age=0";
        document.cookie = "username=; path=/; max-age=0";
        document.cookie = "userId=; path=/; max-age=0";

        // Provide more detailed error message for debugging
        let errorMessage = "Terjadi kesalahan saat login. ";

        if (error.message) {
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError")
          ) {
            errorMessage += "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
          } else if (error.message.includes("405")) {
            errorMessage += "Kesalahan konfigurasi API (405 Method Not Allowed). Hubungi administrator.";
          } else if (error.message.includes("JSON")) {
            errorMessage += "Format respons tidak valid. Hubungi administrator.";
          } else {
            errorMessage += error.message;
          }
        } else {
          errorMessage += "Silakan coba lagi nanti.";
        }

        setLoginError(errorMessage);

        // Diagnostic information
        try {
          // Test API health directly
          fetch("/api/health", { method: "GET" })
            .then((res) => res.json())
            .then((data) => {
              setApiInfo(`API Health Status: ${JSON.stringify(data)}`);
            })
            .catch((healthErr) => {
              setApiInfo(`API Health Check Failed: ${healthErr.message}`);
            });
        } catch (diagErr) {
          setApiInfo(`Diagnostic error: ${diagErr}`);
        }
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        {" "}
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="/dbc.png"
              alt="Daster Bordir Cantik Logo"
              width={100}
              height={100}
              className="rounded-md"
            />
          </div>
          <CardTitle className="text-2xl text-center">
            Daster Bordir Cantik
          </CardTitle>
          <CardDescription className="text-center">
            Login to access your POS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                  setLoginError("");
                }}
                disabled={isLoading}
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                    setLoginError("");
                  }}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>            <Button
              type="submit"
              className="w-full bg-violet-500 hover:bg-violet-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>

            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                className="text-xs"
              >
                <Bug className="mr-2 h-3 w-3" />
                Run Diagnostics
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="text-xs"
              >
                {showDiagnostics ? <ChevronUp className="mr-2 h-3 w-3" /> : <ChevronDown className="mr-2 h-3 w-3" />}
                {showDiagnostics ? "Hide Details" : "Show Details"}
              </Button>
            </div>

            {(apiInfo || showDiagnostics) && (
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                <p className="font-semibold">Debug Information (Developer Only):</p>
                <pre className="break-all whitespace-pre-wrap">{apiInfo || "Click 'Run Diagnostics' to test API endpoints"}</pre>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
