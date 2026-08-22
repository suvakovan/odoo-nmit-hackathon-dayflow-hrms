"use client";
import Sidebar from "@/components/ui/Sidebar";
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

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
