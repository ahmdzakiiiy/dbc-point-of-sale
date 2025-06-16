"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Home,
  Package,
  ShoppingCart,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

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
  ];

  const handleLogout = () => {
    // Clear login state from localStorage
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");

    // Clear cookies
    document.cookie =
      "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Redirect to login page
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-violet-500" />
          <span>Daster Bordir Cantik</span>
        </div>{" "}
        <nav className="ml-auto flex items-center gap-2 sm:gap-4 md:gap-6">
          {" "}
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>              <div
                className={cn(
                  "flex items-center gap-2 py-2 px-1 mx-0 sm:mx-1 md:mx-2 relative font-medium",
                  "hover:after:w-full after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-violet-500",
                  "after:w-0 after:transition-all after:duration-300 after:ease-in-out",
                  pathname === item.href && "after:w-full"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </div>
            </Link>
          ))}
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="p-1 cursor-pointer flex items-center justify-center">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">
                {username || "Admin"}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
