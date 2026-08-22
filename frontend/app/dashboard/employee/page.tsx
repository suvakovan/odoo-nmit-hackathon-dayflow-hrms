"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { dashboardApi, attendanceApi } from "@/lib/api";
import { StatCard, PageHeader, EmptyState } from "@/components/ui";
import { formatDate, getLeaveStatusBadge } from "@/lib/utils";

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.employee();
      setData(res.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn();
      toast.success("Checked in successfully!");
      fetchDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await attendanceApi.checkOut();
      toast.success("Checked out successfully!");
      fetchDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const emp = data?.employee;
  const att = data?.attendance;
  const balances = data?.leave_balances || [];
  const recentLeaves = data?.recent_leaves || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good ${getGreeting()}, ${emp?.name?.split(" ")[0] ?? ""}!`}
        subtitle={`${emp?.department} · ${emp?.designation}`}
      />

      {/* Check In/Out Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${att?.today_checked_in ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-slate-700/30 border border-slate-600/30"}`}>
            <Clock className={`w-5 h-5 ${att?.today_checked_in ? "text-emerald-400" : "text-slate-500"}`} />
          </div>
          <div>
            <p className="text-white font-semibold">
              {att?.today_checked_out ? "Checked Out" : att?.today_checked_in ? "Checked In" : "Not Checked In"}
            </p>
            <p className="text-slate-400 text-sm">
              {att?.today_status ? `Status: ${att.today_status}` : "Mark your attendance for today"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {!att?.today_checked_in && (
            <button id="check-in-btn" onClick={handleCheckIn} disabled={checkingIn} className="btn-success flex items-center gap-2">
              {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Check In
            </button>
          )}
          {att?.today_checked_in && !att?.today_checked_out && (
            <button id="check-out-btn" onClick={handleCheckOut} disabled={checkingOut} className="btn-danger flex items-center gap-2">
              {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Check Out
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Attendance This Month"
          value={`${att?.percentage ?? 0}%`}
          subtitle={`${att?.present_days} days present`}
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
        />
        {balances.slice(0, 2).map((b: any) => (
          <StatCard
            key={b.type}
            title={`${b.type} Leave Balance`}
            value={`${b.remaining} days`}
            subtitle={`${b.used} used of ${b.total}`}
            icon={<Calendar className="w-5 h-5" />}
            color={b.remaining > 3 ? "emerald" : "amber"}
          />
        ))}
      </div>

      {/* Leave Balances Full */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold font-outfit mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Leave Balances
          </h3>
          <div className="space-y-3">
            {balances.map((b: any) => (
              <div key={b.type} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{b.type} Leave</span>
                    <span className="text-slate-400">{b.remaining}/{b.total} days</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                      style={{ width: `${((b.used / b.total) * 100) || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {balances.length === 0 && <EmptyState title="No leave balance configured" />}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-semibold font-outfit mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" /> Recent Leave Requests
          </h3>
          <div className="space-y-2">
            {recentLeaves.length === 0 && <EmptyState title="No leave requests yet" />}
            {recentLeaves.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{l.type} Leave</p>
                  <p className="text-slate-400 text-xs">{formatDate(l.start)} → {formatDate(l.end)}</p>
                </div>
                <span className={`badge ${getLeaveStatusBadge(l.status)}`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
