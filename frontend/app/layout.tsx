import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Dayflow HRMS — Human Resource Management System",
  description:
    "Dayflow is a modern, full-featured HRMS for managing employees, attendance, leave, and payroll.",
  keywords: ["HRMS", "HR Management", "Attendance", "Leave Management", "Payroll"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(222 47% 7%)",
                color: "hsl(213 31% 91%)",
                border: "1px solid hsl(216 34% 17%)",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#10B981", secondary: "#0F172A" },
              },
              error: {
                iconTheme: { primary: "#EF4444", secondary: "#0F172A" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
