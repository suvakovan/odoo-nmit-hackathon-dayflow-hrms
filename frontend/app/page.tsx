"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function HomePage() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push(role === "ADMIN" ? "/dashboard/admin" : "/dashboard/employee");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, role, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
        <p className="text-slate-400 text-sm">Loading Dayflow…</p>
      </div>
    </div>
  );
}
