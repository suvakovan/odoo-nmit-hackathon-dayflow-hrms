"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { attendanceApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate, formatDateTime, getAttendanceStatusBadge } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { AttendanceRecord } from "@/lib/types";

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAttendance = async () => {
    try {
      const res = await attendanceApi.myAttendance({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setRecords(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        toast.error("Failed to load attendance");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const today = records.find((r) => r.date === new Date().toISOString().split("T")[0]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn();
      toast.success("Checked in!");
      fetchAttendance();
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
      toast.success("Checked out!");
      fetchAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Attendance" subtitle="Track your daily attendance and working hours" />

      {/* Today's Status */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm mb-1">Today — {formatDate(new Date().toISOString())}</p>
            <div className="flex items-center gap-3">
              {today ? (
                <span className={`badge ${getAttendanceStatusBadge(today.status)}`}>{today.status}</span>
              ) : (
                <span className="badge badge-neutral">Not marked</span>
              )}
              {today?.check_in && <p className="text-text-secondary text-sm">In: {formatDateTime(today.check_in)}</p>}
              {today?.check_out && <p className="text-text-secondary text-sm">Out: {formatDateTime(today.check_out)}</p>}
              {today?.working_hours != null && (
                <p className="text-emerald-400 text-sm font-semibold">{today.working_hours}h worked</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {!today?.check_in && (
              <button id="check-in-btn" onClick={handleCheckIn} disabled={checkingIn} className="btn-success flex items-center gap-2">
                {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Check In
              </button>
            )}
            {today?.check_in && !today?.check_out && (
              <button id="check-out-btn" onClick={handleCheckOut} disabled={checkingOut} className="btn-danger flex items-center gap-2">
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Check Out
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter & View Mode Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              const todayStr = new Date().toISOString().split("T")[0];
              setDateFrom(todayStr);
              setDateTo(todayStr);
              attendanceApi.myAttendance({ date_from: todayStr, date_to: todayStr }).then(r => setRecords(r.data));
            }}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Daily View (Today)
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
              const todayStr = now.toISOString().split("T")[0];
              setDateFrom(weekAgo);
              setDateTo(todayStr);
              attendanceApi.myAttendance({ date_from: weekAgo, date_to: todayStr }).then(r => setRecords(r.data));
            }}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Weekly View (Last 7 Days)
          </button>
        </div>

        <div className="flex gap-3 items-end">
          <div><label className="form-label text-xs">From</label><input type="date" className="form-input text-xs py-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
          <div><label className="form-label text-xs">To</label><input type="date" className="form-input text-xs py-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          <div><button onClick={fetchAttendance} className="btn-primary text-xs py-1.5 px-3">Apply Filter</button></div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : records.length === 0 ? (
        <EmptyState title="No attendance records" icon={<Clock className="w-10 h-10" />} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="text-text-primary font-medium">{formatDate(r.date)}</td>
                  <td className="text-text-secondary text-sm">{r.check_in ? formatDateTime(r.check_in) : "—"}</td>
                  <td className="text-text-secondary text-sm">{r.check_out ? formatDateTime(r.check_out) : "—"}</td>
                  <td className="text-text-secondary">{r.working_hours != null ? `${r.working_hours}h` : "—"}</td>
                  <td><span className={`badge ${getAttendanceStatusBadge(r.status)}`}>{r.status}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
