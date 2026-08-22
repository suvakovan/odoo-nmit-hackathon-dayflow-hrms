"use client";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
export default function LeaveLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);
  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!isAuthenticated) return null;
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

