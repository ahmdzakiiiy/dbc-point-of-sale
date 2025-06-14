"use client"

import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication status on app load
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    const protectedPaths = ["/dashboard", "/cashier", "/stock", "/reports"]
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

    // If user is not logged in and trying to access protected route
    if (!isLoggedIn && isProtectedPath) {
      router.push("/login")
    }

    // If user is logged in and on login page, redirect to dashboard
    if (isLoggedIn && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [pathname, router])

  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
