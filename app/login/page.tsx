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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
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
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    // Validate before submission
    validateUsername(username);
    validatePassword(password);

    // Only proceed if no validation errors
    if (username.length >= 3 && password.length >= 8) {
      try {
        // Call our API endpoint
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
          // Use the auth context to manage login state
          login(username, data.user.id);

          // API route will set the cookies for us

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
      } catch (error) {
        console.error("Login error:", error);
        // Pastikan tidak ada data autentikasi yang tersisa jika terjadi error
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");

        // Clear cookies
        document.cookie = "isLoggedIn=; path=/; max-age=0";
        document.cookie = "username=; path=/; max-age=0";
        document.cookie = "userId=; path=/; max-age=0";

        setLoginError("Terjadi kesalahan saat login. Silakan coba lagi.");
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
              src="/dress-svgrepo-com.svg"
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
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-500 hover:bg-violet-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
