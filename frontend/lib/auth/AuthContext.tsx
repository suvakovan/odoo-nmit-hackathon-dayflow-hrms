"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { UserResponse, Role } from "@/lib/types";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    document.cookie = `access_token=${access_token}; path=/; max-age=86400`;
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);

    const userRes = await authApi.me();
    setUser(userRes.data);

    // Route based on role
    if (userRes.data.role === "ADMIN") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/employee");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    router.push("/login");
  };

  const refresh = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
