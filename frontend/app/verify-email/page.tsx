"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please request a new link.");
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been verified successfully. You can now log in.");
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.response?.data?.detail || "Email verification failed. The link may have expired.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="glass-card p-8 text-center space-y-6">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          <p className="text-slate-300 text-sm font-medium">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
          <p className="text-slate-300 text-sm font-medium">{message}</p>
          <Link href="/login" className="btn-primary w-full mt-2 inline-block">
            Proceed to Login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <XCircle className="w-12 h-12 text-red-400" />
          <p className="text-slate-300 text-sm font-medium">{message}</p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-outfit font-bold text-xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">Email Verification</h1>
          <p className="text-slate-400 mt-1 text-sm">Dayflow HRMS</p>
        </div>

        <Suspense fallback={
          <div className="glass-card p-8 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <p className="text-slate-300 text-sm font-medium">Loading verification context...</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
