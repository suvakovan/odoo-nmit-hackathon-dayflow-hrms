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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg text-text-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-3 shadow-lg shadow-purple-900/20">
            <span className="font-outfit font-bold text-2xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-outfit tracking-wide">Dayflow</h1>
          <p className="text-text-secondary mt-1 text-sm">Human Resource Management System</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-text-primary mb-6 font-outfit">Welcome back</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
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
                <p className="text-danger text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">{errors.password.message}</p>
              )}
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
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
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <p className="text-xs text-center text-text-secondary font-medium">1-Click Quick Demo Access:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", "admin@dayflow.com");
                    setValue("password", "AdminPassword123!");
                    onSubmit({ email: "admin@dayflow.com", password: "AdminPassword123!" });
                  }}
                  disabled={isLoading}
                  className="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-xs font-medium text-primary flex items-center justify-center gap-1.5 transition-all shadow-sm"
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
                  className="px-3 py-2.5 bg-bg hover:bg-table-header-bg border border-border rounded-xl text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  👤 Demo Employee
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-text-secondary text-xs mt-6">
          © {new Date().getFullYear()} Dayflow HRMS. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
