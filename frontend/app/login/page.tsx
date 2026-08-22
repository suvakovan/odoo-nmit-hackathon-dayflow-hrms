"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-outfit font-bold text-xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">Dayflow</h1>
          <p className="text-slate-400 mt-1 text-sm">Human Resource Management System</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6 font-outfit">Welcome back</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="you@company.com"
                  className="form-input pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="form-input pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Quick Demo Access */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <p className="text-xs text-center text-slate-500 font-medium">1-Click Quick Demo Access:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", "admin@dayflow.com");
                    setValue("password", "AdminPassword123!");
                    onSubmit({ email: "admin@dayflow.com", password: "AdminPassword123!" });
                  }}
                  disabled={isLoading}
                  className="px-3 py-2.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl text-xs font-medium text-indigo-300 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  🛡️ Demo Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", "employee@dayflow.com");
                    setValue("password", "EmployeePassword123!");
                    onSubmit({ email: "employee@dayflow.com", password: "EmployeePassword123!" });
                  }}
                  disabled={isLoading}
                  className="px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  👤 Demo Employee
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Dayflow HRMS. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
