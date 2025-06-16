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
  const [showLogoutIcon, setShowLogoutIcon] = useState(false)
  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
    
    // Close logout icon when clicking outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-menu-container')) {
        setShowLogoutIcon(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
    <header className="sticky top-0 z-10 w-full border-b bg-background">      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-violet-500" />
          <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">Daster Bordir Cantik</span>
        </div>

        <nav className="ml-auto flex items-center gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className={cn("flex items-center gap-2", pathname === item.href && "bg-muted")}>
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </Button>
            </Link>
          ))}          {/* User Menu - Click Profile to show Logout */}
          <div className="flex flex-col items-center gap-2 relative profile-menu-container">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setShowLogoutIcon(!showLogoutIcon)}
            >
              <User className="h-5 w-5" />
              <span className="sr-only">User Profile</span>
            </Button>
            
            {showLogoutIcon && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-10 rounded-full w-7 h-7 flex items-center justify-center text-red-600 hover:text-red-700 bg-white shadow-md border border-gray-100 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
