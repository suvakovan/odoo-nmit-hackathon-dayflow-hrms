"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { dashboardApi, leaveApi } from "@/lib/api";
import { StatCard, PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.admin()
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          toast.error("Failed to load dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await leaveApi.approve(id);
      toast.success("Leave approved!");
      const res = await dashboardApi.admin();
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to approve");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveApi.reject(id);
      toast.success("Leave rejected.");
      const res = await dashboardApi.admin();
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to reject");
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;

  const stats = data?.stats;
  const pendingLeaves = data?.recent_pending_leaves || [];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Admin Dashboard" subtitle="Overview of your organization" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={stats?.total_employees ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Present Today"
          value={stats?.today_present ?? 0}
          subtitle={`${stats?.attendance_rate ?? 0}% rate`}
          icon={<Clock className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Absent Today"
          value={stats?.today_absent ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pending_leave_requests ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pending Leave Approvals */}
        <div className="glass-card p-6">
          <h3 className="text-text-primary font-semibold font-outfit mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" /> Pending Leave Approvals
          </h3>
          {pendingLeaves.length === 0 ? (
            <EmptyState title="No pending requests" subtitle="All leave requests are processed!" icon={<CheckCircle className="w-8 h-8" />} />
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-text-primary text-sm font-medium">{l.type} Leave</p>
                    <p className="text-text-secondary text-xs">{formatDate(l.start)} → {formatDate(l.end)} · {l.days} day(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id={`approve-${l.id}`}
                      onClick={() => handleApprove(l.id)}
                      className="btn-success py-1 px-3 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      id={`reject-${l.id}`}
                      onClick={() => handleReject(l.id)}
                      className="btn-danger py-1 px-3 text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
