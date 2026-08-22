"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-text-primary font-outfit">Forgot Password</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Enter your account email to receive reset instructions
          </p>
        </div>

        <div className="glass-card p-8 shadow-xl border border-border">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h3 className="text-lg font-bold text-text-primary font-outfit">Check Your Email</h3>
              <p className="text-text-secondary text-sm">
                We sent password reset instructions to <strong className="text-text-primary">{email}</strong> via Brevo SMTP.
              </p>
              <Link href="/login" className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-secondary" /> Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                id="request-reset-btn"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-text-secondary hover:text-text-primary text-xs font-medium inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
