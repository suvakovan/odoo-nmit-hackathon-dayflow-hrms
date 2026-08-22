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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

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
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Account created! Check your email for verification.");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-bg text-text-primary">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mb-4 shadow-lg shadow-purple-900/20">
              <Mail className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary font-outfit">Check Your Inbox</h1>
            <p className="text-text-secondary mt-2 text-sm max-w-sm mx-auto">
              We have sent a verification email to <strong className="text-text-primary">{submittedEmail}</strong> via Brevo SMTP. Please check your inbox and click the verification link.
            </p>
          </div>

          <div className="glass-card p-8 text-center space-y-4 shadow-xl border border-border">
            <p className="text-text-secondary text-sm">
              Didn&apos;t receive the email? Check your spam folder or request a new verification link below.
            </p>
            <button
              onClick={async () => {
                setIsResending(true);
                try {
                  await authApi.resendVerification(submittedEmail);
                  toast.success("Verification email resent successfully!");
                } catch (err: any) {
                  toast.error(err?.response?.data?.detail || "Failed to resend email.");
                } finally {
                  setIsResending(false);
                }
              }}
              disabled={isResending}
              id="resend-verification-btn"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend Verification Email"}
            </button>

            <p className="text-sm mt-4">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Back to Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }


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
