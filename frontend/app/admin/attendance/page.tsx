"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { attendanceApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate, formatDateTime, getAttendanceStatusBadge, cn } from "@/lib/utils";
import { Clock, Filter, AlertTriangle, Check, X, Edit2, Loader2 } from "lucide-react";
import type { AttendanceRecord } from "@/lib/types";

// Helper to convert UTC string to local YYYY-MM-DDTHH:mm format for datetime-local input
const toLocalDatetimeString = (utcString: string | null | undefined) => {
  if (!utcString) return "";
  try {
    const d = new Date(utcString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

// Helper to convert local YYYY-MM-DDTHH:mm to ISO UTC string
const toUtcIsoString = (localString: string) => {
  if (!localString) return undefined;
  try {
    return new Date(localString).toISOString();
  } catch {
    return undefined;
  }
};

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<"all" | "flagged">("all");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [flaggedRecords, setFlaggedRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for All Records
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Editing state for flagged logs
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

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
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlagged = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getFlagged();
      setFlaggedRecords(res.data);
    } catch {
      toast.error("Failed to load flagged attendance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "all") {
      fetchAttendance();
    } else {
      fetchFlagged();
    }
  }, [activeTab]);

  const handleStartEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditCheckIn(toLocalDatetimeString(record.check_in));
    setEditCheckOut(toLocalDatetimeString(record.check_out));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCheckIn("");
    setEditCheckOut("");
  };

  const handleSaveCorrection = async (id: number) => {
    if (!editCheckIn) {
      toast.error("Check-in time is required");
      return;
    }

    const checkInUtc = toUtcIsoString(editCheckIn);
    const checkOutUtc = editCheckOut ? toUtcIsoString(editCheckOut) : undefined;

    if (checkInUtc && checkOutUtc && new Date(checkInUtc) > new Date(checkOutUtc)) {
      toast.error("Check-out time must be after check-in time");
      return;
    }

    setSavingId(id);
    try {
      await attendanceApi.correctTime(id, {
        check_in: checkInUtc,
        check_out: checkOutUtc,
      });
      toast.success("Attendance record corrected successfully!");
      setEditingId(null);
      fetchFlagged();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Correction failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance Management"
        subtitle="Monitor and correct employee attendance logs"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          All Records
        </button>
        <button
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "flagged"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Flagged Logs
          {flaggedRecords.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xxs font-bold rounded-full bg-amber-500 text-slate-950">
              {flaggedRecords.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "all" ? (
        <>
          {/* Filters */}
          <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-end">
            <div>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Employee ID</label>
              <input
                type="number"
                placeholder="Optional"
                className="form-input w-32"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <button
              id="apply-filter-btn"
              onClick={fetchAttendance}
              className="btn-primary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Apply
            </button>
          </div>

          {loading ? (
            <Spinner />
          ) : records.length === 0 ? (
            <EmptyState
              title="No records found"
              subtitle="Try adjusting date range or employee ID"
              icon={<Clock className="w-10 h-10" />}
            />
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
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className={r.flagged ? "bg-amber-500/5 hover:bg-amber-500/10" : ""}
                    >
                      <td className="text-white font-medium flex items-center gap-1.5">
                        {r.flagged && <span title="Flagged"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>}
                        {formatDate(r.date)}
                      </td>
                      <td className="font-mono text-indigo-400 text-xs">{r.employee_id}</td>
                      <td className="text-slate-300 text-sm">
                        {r.check_in ? formatDateTime(r.check_in) : "—"}
                      </td>
                      <td className="text-slate-300 text-sm">
                        {r.check_out ? formatDateTime(r.check_out) : "—"}
                      </td>
                      <td className="text-slate-300">
                        {r.working_hours != null ? `${r.working_hours}h` : "—"}
                      </td>
                      <td>
                        <span className={`badge ${getAttendanceStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {loading ? (
            <Spinner />
          ) : flaggedRecords.length === 0 ? (
            <EmptyState
              title="All caught up!"
              subtitle="No attendance logs are currently flagged for correction"
              icon={<Check className="w-10 h-10 text-emerald-500" />}
            />
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Emp. ID</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedRecords.map((r, i) => {
                    const isEditing = editingId === r.id;
                    const isSaving = savingId === r.id;

                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                      >
                        <td className="text-white font-medium">{formatDate(r.date)}</td>
                        <td className="font-mono text-indigo-400 text-xs">{r.employee_id}</td>
                        <td className="text-slate-300 text-sm">
                          {isEditing ? (
                            <input
                              type="datetime-local"
                              value={editCheckIn}
                              onChange={(e) => setEditCheckIn(e.target.value)}
                              className="form-input text-xs max-w-[190px]"
                            />
                          ) : r.check_in ? (
                            formatDateTime(r.check_in)
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="text-slate-300 text-sm">
                          {isEditing ? (
                            <input
                              type="datetime-local"
                              value={editCheckOut}
                              onChange={(e) => setEditCheckOut(e.target.value)}
                              className="form-input text-xs max-w-[190px]"
                            />
                          ) : r.check_out ? (
                            formatDateTime(r.check_out)
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveCorrection(r.id)}
                                disabled={isSaving}
                                className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                                title="Save Correction"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(r)}
                              className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1.5 ml-auto"
                            >
                              <Edit2 className="w-3 h-3" /> Correct
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
