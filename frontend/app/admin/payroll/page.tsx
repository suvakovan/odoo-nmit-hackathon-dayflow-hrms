"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { payrollApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Edit, Plus, X, Download, Loader2 } from "lucide-react";
import type { SalaryStructure } from "@/lib/types";

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [form, setForm] = useState({ basic: 0, hra: 0, allowances: "", deductions: "" });

  const fetchPayrolls = async () => {
    try {
      const res = await payrollApi.all();
      setPayrolls(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        toast.error("Failed to load payroll data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleUpdate = async (employeeId: number) => {
    try {
      const allowances = JSON.parse(form.allowances || "{}");
      const deductions = JSON.parse(form.deductions || "{}");
      await payrollApi.update(employeeId, {
        basic: form.basic,
        hra: form.hra,
        allowances,
        deductions,
      });
      toast.success("Salary updated successfully!");
      setEditingId(null);
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Update failed");
    }
  };

  const handleDownloadEmployeeSlip = async (employeeId: number) => {
    setDownloadingId(employeeId);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await payrollApi.downloadEmployeeSlip(employeeId, month);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-emp-${employeeId}-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip PDF downloaded!");
    } catch {
      toast.error("Failed to download payslip PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Payroll Management" subtitle="View and update employee salary structures" />

      {payrolls.length === 0 ? (
        <EmptyState title="No salary structures" subtitle="Update salary for employees from their profile." icon={<DollarSign className="w-10 h-10" />} />
      ) : (
        <div className="space-y-3">
          {payrolls.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              {editingId === p.employee_id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold">Editing Salary — Employee #{p.employee_id}</p>
                    <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Basic (₹)</label>
                      <input type="number" className="form-input" value={form.basic} onChange={(e) => setForm((f) => ({ ...f, basic: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="form-label">HRA (₹)</label>
                      <input type="number" className="form-input" value={form.hra} onChange={(e) => setForm((f) => ({ ...f, hra: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="form-label">Allowances (JSON)</label>
                      <input type="text" className="form-input font-mono text-xs" placeholder='{"transport": 2000}' value={form.allowances} onChange={(e) => setForm((f) => ({ ...f, allowances: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Deductions (JSON)</label>
                      <input type="text" className="form-input font-mono text-xs" placeholder='{"pf": 1800}' value={form.deductions} onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button id={`save-salary-${p.employee_id}`} onClick={() => handleUpdate(p.employee_id)} className="btn-primary">Save Changes</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-text-secondary text-xs">Employee #{p.employee_id}</p>
                      <p className="text-text-primary font-semibold font-outfit text-lg">{formatCurrency(p.net_salary)}<span className="text-text-secondary text-sm font-normal"> / month</span></p>
                      <p className="text-text-secondary text-xs">Effective from {formatDate(p.effective_from)}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div><p className="text-text-secondary text-xs">Basic</p><p className="text-text-primary font-medium">{formatCurrency(p.basic)}</p></div>
                      <div><p className="text-text-secondary text-xs">HRA</p><p className="text-text-primary font-medium">{formatCurrency(p.hra)}</p></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadEmployeeSlip(p.employee_id)}
                      disabled={downloadingId === p.employee_id}
                      className="btn-secondary flex items-center gap-1.5"
                    >
                      {downloadingId === p.employee_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Slip
                    </button>
                    <button
                      id={`edit-salary-${p.employee_id}`}
                      onClick={() => {
                        setEditingId(p.employee_id);
                        setForm({
                          basic: p.basic,
                          hra: p.hra,
                          allowances: JSON.stringify(p.allowances),
                          deductions: JSON.stringify(p.deductions),
                        });
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
