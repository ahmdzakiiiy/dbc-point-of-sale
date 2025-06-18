"use client";

import type React from "react";

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({ subsets: ["latin"] });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    // Protect against hydration issues by checking if window is defined
    if (typeof window !== "undefined") {
      // Check authentication status on app load - validate all required auth items exist
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const username = localStorage.getItem("username");
      const userId = localStorage.getItem("userId");

      // Only consider authenticated if ALL needed values exist
      const isAuthenticated = isLoggedIn === "true" && username && userId;

      const protectedPaths = ["/dashboard", "/cashier", "/stock", "/reports"];
      const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
      );
      const isRootPath = pathname === "/";
      const isLoginPath = pathname === "/login";

      // If user is not authenticated and trying to access protected route or root
      if (!isAuthenticated && (isProtectedPath || isRootPath)) {
        // Clear any partial auth data that might exist
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");

        // Clear cookies
        document.cookie = "isLoggedIn=; path=/; max-age=0";
        document.cookie = "username=; path=/; max-age=0";
        document.cookie = "userId=; path=/; max-age=0";

        router.push("/login");
      }

      // If user is authenticated and on login page, redirect to dashboard
      if (isAuthenticated && isLoginPath) {
        router.push("/dashboard");
      }
    }
  }, [pathname, router]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
