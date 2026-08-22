"use client";
import Sidebar from "@/components/ui/Sidebar";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);
  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!isAuthenticated) return null;
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen p-8">{children}</main>
    </div>
  );
}
