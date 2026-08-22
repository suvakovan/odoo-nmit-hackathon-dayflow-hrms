"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Sidebar from "@/components/ui/Sidebar";
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
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
