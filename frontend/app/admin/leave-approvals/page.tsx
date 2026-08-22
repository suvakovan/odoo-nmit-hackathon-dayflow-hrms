"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { leaveApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate, getLeaveStatusBadge } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, MessageSquare, Loader2 } from "lucide-react";
import type { LeaveRequest, LeaveStatus } from "@/lib/types";

export default function AdminLeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | LeaveStatus>("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [commentMap, setCommentMap] = useState<Record<number, string>>({});

  const fetchLeaves = async () => {
    try {
      const res = await leaveApi.all(filter ? { status: filter } : {});
      setLeaves(res.data);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    const comment = commentMap[id];
    try {
      if (action === "approve") {
        await leaveApi.approve(id, comment);
        toast.success("Leave approved!");
      } else {
        await leaveApi.reject(id, comment);
        toast.success("Leave rejected.");
      }
      fetchLeaves();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Leave Approvals" subtitle="Review and manage employee leave requests" />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            id={`filter-${s || "all"}`}
            onClick={() => setFilter(s as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === s
                ? "gradient-primary text-white shadow-lg shadow-indigo-500/20"
                : "bg-white/[0.05] text-slate-400 hover:text-white border border-white/[0.08]"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {leaves.length === 0 ? (
        <EmptyState title="No leave requests" subtitle="Nothing to review right now." icon={<CheckCircle className="w-10 h-10" />} />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge ${getLeaveStatusBadge(leave.status)}`}>{leave.status}</span>
                    <span className="text-white font-semibold text-sm">{leave.leave_type} Leave</span>
                    <span className="text-slate-400 text-xs">· {leave.total_days} day(s)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(leave.start_date)} → {formatDate(leave.end_date)}</span>
                    {leave.remarks && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{leave.remarks}</span>}
                  </div>
                  {leave.review_comment && (
                    <p className="text-slate-500 text-xs mt-1">Comment: {leave.review_comment}</p>
                  )}
                </div>

                {leave.status === "PENDING" && (
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Optional comment…"
                      className="form-input text-xs py-1.5"
                      value={commentMap[leave.id] || ""}
                      onChange={(e) => setCommentMap((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        id={`approve-${leave.id}`}
                        onClick={() => handleAction(leave.id, "approve")}
                        disabled={processingId === leave.id}
                        className="btn-success flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        {processingId === leave.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                      <button
                        id={`reject-${leave.id}`}
                        onClick={() => handleAction(leave.id, "reject")}
                        disabled={processingId === leave.id}
                        className="btn-danger flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        {processingId === leave.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
