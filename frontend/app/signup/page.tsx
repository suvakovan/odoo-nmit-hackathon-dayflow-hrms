"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const schema = z.object({
  first_name: z.string().min(2, "First name required"),
  last_name: z.string().min(2, "Last name required"),
  employee_code: z.string().optional(),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/\d/, "Must contain a number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain special character"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "EMPLOYEE" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authApi.signup(data);
      toast.success("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden bg-bg text-text-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-3 shadow-lg shadow-purple-900/20">
            <span className="font-outfit font-bold text-2xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-outfit tracking-wide">Create Account</h1>
          <p className="text-text-secondary mt-1 text-sm">Join Dayflow HRMS</p>
        </div>

        <div className="glass-card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input {...register("first_name")} id="first_name" placeholder="John" className="form-input pl-9" />
                </div>
                {errors.first_name && <p className="text-danger text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input {...register("last_name")} id="last_name" placeholder="Doe" className="form-input pl-9" />
                </div>
                {errors.last_name && <p className="text-danger text-xs mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Employee ID / Code */}
            <div>
              <label className="form-label">Employee ID (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input {...register("employee_code")} id="employee_code" placeholder="e.g. EMP-1001 (Auto-assigned if empty)" className="form-input pl-9 text-xs" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input {...register("email")} id="email" type="email" placeholder="you@company.com" className="form-input pl-9" />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  {...register("password")}
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 chars, uppercase, number, special"
                  className="form-input pl-9 pr-9"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="form-label">Role</label>
              <select {...register("role")} id="role" className="form-input">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin (HR Officer)</option>
              </select>
            </div>

            <button type="submit" id="signup-submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
