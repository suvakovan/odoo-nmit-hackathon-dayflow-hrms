"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Clock, Calendar, DollarSign,
  Bell, FileText, LogOut, Settings, ChevronRight, UserCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

const employeeLinks = [
  { href: "/dashboard/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/leave", label: "Leave", icon: Calendar },
  { href: "/payroll", label: "Payroll", icon: DollarSign },
];

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/leave-approvals", label: "Leave Approvals", icon: Calendar },
  { href: "/admin/payroll", label: "Payroll", icon: DollarSign },
  { href: "/admin/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const links = role === "ADMIN" ? adminLinks : employeeLinks;
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "DF";

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full w-[260px] flex flex-col bg-card border-r border-border z-30"
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-outfit font-bold text-sm">D</span>
          </div>
          <div>
            <h1 className="text-white font-outfit font-bold text-lg leading-none">Dayflow</h1>
            <p className="text-xs text-slate-500 mt-0.5">HRMS</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 pt-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold",
          role === "ADMIN"
            ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
            : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
        )}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {role === "ADMIN" ? "HR Admin" : "Employee"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} id={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className={cn("sidebar-link", isActive && "active")}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg glass-card mb-1">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email}</p>
            <p className="text-slate-500 text-xs capitalize">{role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          id="logout-btn"
          className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-red-400 text-sm rounded-lg hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
