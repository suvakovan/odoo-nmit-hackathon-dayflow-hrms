"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { attendanceApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate, formatDateTime, getAttendanceStatusBadge } from "@/lib/utils";
import { Clock, Filter } from "lucide-react";
import type { AttendanceRecord } from "@/lib/types";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.all({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        employee_id: employeeId ? Number(employeeId) : undefined,
      });
      setRecords(res.data);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendance Records" subtitle="View and filter all employee attendance" />

      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Employee ID</label>
          <input type="number" placeholder="Optional" className="form-input w-32" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </div>
        <button id="apply-filter-btn" onClick={fetchAttendance} className="btn-primary flex items-center gap-2">
          <Filter className="w-4 h-4" /> Apply
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : records.length === 0 ? (
        <EmptyState title="No records found" subtitle="Try adjusting date range or employee ID" icon={<Clock className="w-10 h-10" />} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Emp. ID</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="text-white font-medium">{formatDate(r.date)}</td>
                  <td className="font-mono text-indigo-400 text-xs">{r.employee_id}</td>
                  <td className="text-slate-300 text-sm">{r.check_in ? formatDateTime(r.check_in) : "—"}</td>
                  <td className="text-slate-300 text-sm">{r.check_out ? formatDateTime(r.check_out) : "—"}</td>
                  <td className="text-slate-300">{r.working_hours != null ? `${r.working_hours}h` : "—"}</td>
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
