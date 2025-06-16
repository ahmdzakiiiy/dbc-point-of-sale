"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, id: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check for stored auth data when component mounts
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const username = localStorage.getItem("username");
      const userId = localStorage.getItem("userId");

      if (isLoggedIn === "true" && username && userId) {
        setUser({
          id: userId,
          username,
        });
      } else {
        // Pastikan state user kosong jika tidak ada data auth yang lengkap
        setUser(null);
        // Hapus data auth yang tidak lengkap
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");

        // Clear cookies
        document.cookie = "isLoggedIn=; path=/; max-age=0";
        document.cookie = "username=; path=/; max-age=0";
        document.cookie = "userId=; path=/; max-age=0";
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (username: string, id: string) => {
    setUser({ id, username });
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("userId", id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");

    // Clear cookies
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    document.cookie = "userId=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
