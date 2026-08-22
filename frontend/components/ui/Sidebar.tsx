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
      className="fixed left-0 top-0 h-full w-[260px] flex flex-col bg-sidebar-bg border-r border-border text-sidebar-text z-30 shadow-md"
    >
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md border border-white/20">
            <span className="text-white font-outfit font-bold text-sm">D</span>
          </div>
          <div>
            <h1 className="text-sidebar-text font-outfit font-bold text-lg leading-none">Dayflow</h1>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">HR Management</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 pt-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border",
          role === "ADMIN"
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-table-header-bg border-border text-text-primary"
        )}>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {role === "ADMIN" ? "HR Admin" : "Employee Workspace"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} id={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border border-transparent",
                isActive
                  ? "bg-sidebar-active text-white font-semibold shadow-sm border-sidebar-active"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-text-primary"
              )}>
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "opacity-75")} />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60 text-white" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border bg-sidebar-hover/30">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface mb-1 border border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-medium truncate">{user?.email}</p>
            <p className="text-text-secondary text-[10px] capitalize font-medium">{role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          id="logout-btn"
          className="flex items-center gap-2 w-full px-3 py-2 text-text-secondary hover:text-danger text-xs rounded-lg hover:bg-danger/10 transition-all duration-200 mt-1 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
