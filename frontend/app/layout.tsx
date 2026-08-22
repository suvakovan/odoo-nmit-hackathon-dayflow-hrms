import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Dayflow HRMS — Human Resource Management System",
  description:
    "Dayflow is a modern, full-featured HRMS for managing employees, attendance, leave, and payroll.",
  keywords: ["HRMS", "HR Management", "Attendance", "Leave Management", "Payroll"],
};

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('dayflow-theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-bg text-primary antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                },
                success: {
                  iconTheme: { primary: "#2E9E5B", secondary: "#FFFFFF" },
                },
                error: {
                  iconTheme: { primary: "#D64545", secondary: "#FFFFFF" },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
