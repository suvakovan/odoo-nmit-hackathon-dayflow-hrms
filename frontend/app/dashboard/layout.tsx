"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import { Spinner } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-bg text-text-primary">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

