"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Home, Package, ShoppingCart, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [username, setUsername] = useState("")

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Kasir",
      href: "/cashier",
      icon: ShoppingCart,
    },
    {
      name: "Stok",
      href: "/stock",
      icon: Package,
    },
    {
      name: "Laporan",
      href: "/reports",
      icon: BarChart,
    },
  ]

  const handleLogout = () => {
    // Clear login state from localStorage
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("username")

    // Clear cookies
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Redirect to login page
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-violet-500" />
          <span>Daster Bordir Cantik</span>
        </div>

        <nav className="ml-auto flex items-center gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className={cn("flex items-center gap-2", pathname === item.href && "bg-muted")}>
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </Button>
            </Link>
          ))}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">{username || "Admin"}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
