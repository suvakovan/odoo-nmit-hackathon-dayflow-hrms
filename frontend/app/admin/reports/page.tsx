"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { reportsApi } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/ui";
import { Download, FileText, BarChart2, DollarSign } from "lucide-react";

export default function AdminReportsPage() {
  const [leaveSummary, setLeaveSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPayroll, setDownloadingPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    reportsApi.leaveSummary()
      .then((r) => setLeaveSummary(r.data))
      .catch(() => toast.error("Failed to load leave summary"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadAttendance = async () => {
    setDownloading(true);
    try {
      const res = await reportsApi.attendance({ format: "csv" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance-report.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance report downloaded!");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPayroll = async () => {
    setDownloadingPayroll(true);
    try {
      const res = await reportsApi.payroll({ month: payrollMonth });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-report-${payrollMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payroll report downloaded!");
    } catch {
      toast.error("Failed to download payroll report");
    } finally {
      setDownloadingPayroll(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" subtitle="Export data and view summaries" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Attendance Report</p>
              <p className="text-slate-400 text-sm">Export all attendance data as CSV</p>
            </div>
          </div>
          <button
            id="download-attendance-btn"
            onClick={handleDownloadAttendance}
            disabled={downloading}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Downloading…" : "Download CSV"}
          </button>
        </div>

        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <BarChart2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Leave Summary</p>
            <p className="text-slate-400 text-sm">Leave usage breakdown by department</p>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Payroll Report</p>
              <p className="text-slate-400 text-sm">Export monthly payroll sheet as CSV</p>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">Month:</label>
                <input
                  type="month"
                  className="form-input py-0.5 px-2 text-xs bg-slate-900 border-white/[0.08]"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button
            id="download-payroll-btn"
            onClick={handleDownloadPayroll}
            disabled={downloadingPayroll}
            className="btn-primary flex items-center gap-2 self-stretch md:self-auto justify-center"
          >
            <Download className="w-4 h-4" />
            {downloadingPayroll ? "Downloading…" : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Leave Summary Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold font-outfit">Leave Usage by Department</h3>
        </div>
        {loading ? (
          <Spinner />
        ) : leaveSummary.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No data available</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Allocated</th>
                <th>Used</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {leaveSummary.map((r, i) => (
                <tr key={i}>
                  <td className="text-white font-medium">{r.department}</td>
                  <td><span className="badge badge-info">{r.leave_type}</span></td>
                  <td className="text-slate-300">{r.total_allocated_days}d</td>
                  <td className="text-slate-300">{r.total_used_days}d</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.utilization_pct}%` }} />
                      </div>
                      <span className="text-slate-400 text-xs">{r.utilization_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
