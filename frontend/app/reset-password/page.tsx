"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset token.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-error text-sm font-medium">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="btn-secondary w-full inline-block">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h3 className="text-lg font-bold text-text-primary font-outfit">Password Updated!</h3>
        <p className="text-text-secondary text-sm">
          Your password has been reset successfully. Redirecting you to login...
        </p>
        <Link href="/login" className="btn-primary w-full inline-block">
          Login Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="form-label flex items-center gap-2">
          <Lock className="w-4 h-4 text-text-secondary" /> New Password
        </label>
        <input
          id="new-password"
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <p className="text-[11px] text-text-secondary mt-1">
          Must be at least 8 characters with 1 uppercase, 1 digit & 1 special character.
        </p>
      </div>

      <div>
        <label className="form-label flex items-center gap-2">
          <Lock className="w-4 h-4 text-text-secondary" /> Confirm New Password
        </label>
        <input
          id="confirm-password"
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        id="reset-password-btn"
        disabled={loading}
        className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
      </button>

      <div className="text-center pt-2">
        <Link href="/login" className="text-text-secondary hover:text-text-primary text-xs font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mb-4 shadow-lg shadow-purple-900/20">
            <span className="text-white font-outfit font-bold text-xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-outfit">Set New Password</h1>
          <p className="text-text-secondary mt-1 text-sm">Dayflow HRMS</p>
        </div>

        <div className="glass-card p-8 shadow-xl border border-border">
          <Suspense fallback={
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-text-secondary text-sm">Loading security token...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
