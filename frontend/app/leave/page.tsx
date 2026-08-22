"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { leaveApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner, Modal } from "@/components/ui";
import { formatDate, getLeaveStatusBadge } from "@/lib/utils";
import { Calendar, Plus, Loader2 } from "lucide-react";
import type { LeaveRequest, LeaveBalance } from "@/lib/types";

const schema = z.object({
  leave_type: z.enum(["PAID", "SICK", "UNPAID"]),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: "PAID" },
  });

  const fetchData = async () => {
    try {
      const [histRes, balRes] = await Promise.all([leaveApi.myHistory(), leaveApi.myBalance()]);
      setLeaves(histRes.data);
      setBalances(balRes.data);
    } catch {
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: FormData) => {
    setApplying(true);
    try {
      await leaveApi.apply(data);
      toast.success("Leave request submitted!");
      setShowModal(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Application failed");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leave and track your requests"
        actions={
          <button id="apply-leave-btn" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        }
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {balances.map((b) => (
          <div key={b.id} className="stat-card">
            <p className="text-xs text-slate-400 uppercase font-semibold">{b.leave_type} Leave</p>
            <p className="text-3xl font-bold text-white font-outfit">{b.remaining_days}<span className="text-slate-500 text-sm font-normal">/{b.total_days}</span></p>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{ width: `${(b.used_days / b.total_days) * 100 || 0}%` }} />
            </div>
            <p className="text-xs text-slate-500">{b.used_days} days used</p>
          </div>
        ))}
        {balances.length === 0 && <p className="text-slate-500 col-span-3 text-sm">No leave balance configured for this year.</p>}
      </div>

      {/* Leave History */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold font-outfit">Leave History</h3>
        </div>
        {leaves.length === 0 ? (
          <EmptyState title="No leave requests" subtitle="Your leave history will appear here." icon={<Calendar className="w-8 h-8" />} />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Remarks</th><th>Status</th></tr>
            </thead>
            <tbody>
              {leaves.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="text-white font-medium">{l.leave_type}</td>
                  <td>{formatDate(l.start_date)}</td>
                  <td>{formatDate(l.end_date)}</td>
                  <td className="text-slate-300">{l.total_days}</td>
                  <td className="text-slate-400 text-sm truncate max-w-[160px]">{l.remarks || "—"}</td>
                  <td><span className={`badge ${getLeaveStatusBadge(l.status)}`}>{l.status}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Leave Type</label>
            <select {...register("leave_type")} id="leave-type-select" className="form-input">
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Date</label>
              <input {...register("start_date")} id="leave-start" type="date" className="form-input" />
              {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input {...register("end_date")} id="leave-end" type="date" className="form-input" />
              {errors.end_date && <p className="text-red-400 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Remarks (optional)</label>
            <textarea {...register("remarks")} id="leave-remarks" className="form-input resize-none" rows={2} placeholder="Reason for leave…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" id="submit-leave-btn" disabled={applying} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
