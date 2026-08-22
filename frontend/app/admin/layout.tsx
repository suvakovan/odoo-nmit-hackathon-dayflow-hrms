"use client";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) router.push("/login");
      else if (role !== "ADMIN") router.push("/dashboard/employee");
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading || !isAuthenticated || role !== "ADMIN") {
    return <Spinner className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen flex bg-bg text-text-primary">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

