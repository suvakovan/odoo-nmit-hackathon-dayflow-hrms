"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { payrollApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Edit, Plus, X, Download, Loader2 } from "lucide-react";
import type { SalaryStructure } from "@/lib/types";

interface FormState {
  basic: number;
  hra: number;
  hand_money: number;
  transport: number;
  special: number;
  transaction_fee: number;
  monthly_savings: number;
  pf: number;
}

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    basic: 50000,
    hra: 20000,
    hand_money: 10000,
    transport: 5000,
    special: 5000,
    transaction_fee: 250,
    monthly_savings: 5000,
    pf: 3600,
  });

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
      const allowances: Record<string, number> = {};
      if (form.hand_money > 0) allowances["hand_money"] = form.hand_money;
      if (form.transport > 0) allowances["transport"] = form.transport;
      if (form.special > 0) allowances["special"] = form.special;

      const deductions: Record<string, number> = {};
      if (form.transaction_fee > 0) deductions["transaction_fee"] = form.transaction_fee;
      if (form.monthly_savings > 0) deductions["monthly_savings"] = form.monthly_savings;
      if (form.pf > 0) deductions["pf"] = form.pf;

      await payrollApi.update(employeeId, {
        basic: form.basic,
        hra: form.hra,
        allowances,
        deductions,
      });
      toast.success("Salary structure updated successfully!");
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
      <PageHeader title="Payroll Management" subtitle="View and update employee salary structures & fees" />

      {payrolls.length === 0 ? (
        <EmptyState title="No salary structures" subtitle="Salary structures will auto-populate upon viewing." icon={<DollarSign className="w-10 h-10" />} />
      ) : (
        <div className="space-y-4">
          {payrolls.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              {editingId === p.employee_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-text-primary font-bold text-lg font-outfit">Edit Salary Structure — Employee #{p.employee_id}</h3>
                      <p className="text-text-secondary text-xs">Update base salary, allowances, fees, and monthly savings</p>
                    </div>
                    <button onClick={() => setEditingId(null)} className="p-1 rounded-lg hover:bg-slate-800"><X className="w-5 h-5 text-slate-400" /></button>
                  </div>

                  {/* Earnings Row */}
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-emerald-400 mb-2">Earnings & Allowances</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="form-label">Basic Salary (₹)</label>
                        <input type="number" className="form-input" value={form.basic} onChange={(e) => setForm((f) => ({ ...f, basic: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">HRA (₹)</label>
                        <input type="number" className="form-input" value={form.hra} onChange={(e) => setForm((f) => ({ ...f, hra: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">Hand Money / Cash Allowance (₹)</label>
                        <input type="number" className="form-input" value={form.hand_money} onChange={(e) => setForm((f) => ({ ...f, hand_money: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">Transport Allowance (₹)</label>
                        <input type="number" className="form-input" value={form.transport} onChange={(e) => setForm((f) => ({ ...f, transport: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">Special Allowance (₹)</label>
                        <input type="number" className="form-input" value={form.special} onChange={(e) => setForm((f) => ({ ...f, special: Number(e.target.value) }))} />
                      </div>
                    </div>
                  </div>

                  {/* Deductions Row */}
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-red-400 mb-2">Deductions, Fees & Savings</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="form-label">Transaction Fee (₹)</label>
                        <input type="number" className="form-input" value={form.transaction_fee} onChange={(e) => setForm((f) => ({ ...f, transaction_fee: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">Monthly Savings (₹)</label>
                        <input type="number" className="form-input" value={form.monthly_savings} onChange={(e) => setForm((f) => ({ ...f, monthly_savings: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-label">Provident Fund (PF) (₹)</label>
                        <input type="number" className="form-input" value={form.pf} onChange={(e) => setForm((f) => ({ ...f, pf: Number(e.target.value) }))} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button id={`save-salary-${p.employee_id}`} onClick={() => handleUpdate(p.employee_id)} className="btn-primary">Save Salary Structure</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-indigo">Employee #{p.employee_id}</span>
                        <span className="text-text-secondary text-xs">Effective from {formatDate(p.effective_from)}</span>
                      </div>
                      <p className="text-3xl font-bold font-outfit text-text-primary">
                        {formatCurrency(p.net_salary)} <span className="text-text-secondary text-sm font-normal">/ month Net</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadEmployeeSlip(p.employee_id)}
                        disabled={downloadingId === p.employee_id}
                        className="btn-secondary flex items-center gap-1.5"
                      >
                        {downloadingId === p.employee_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download Slip
                      </button>
                      <button
                        id={`edit-salary-${p.employee_id}`}
                        onClick={() => {
                          setEditingId(p.employee_id);
                          setForm({
                            basic: p.basic || 50000,
                            hra: p.hra || 20000,
                            hand_money: p.allowances?.hand_money || 10000,
                            transport: p.allowances?.transport || 5000,
                            special: p.allowances?.special || 5000,
                            transaction_fee: p.deductions?.transaction_fee || 250,
                            monthly_savings: p.deductions?.monthly_savings || 5000,
                            pf: p.deductions?.pf || 3600,
                          });
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Edit Salary Structure
                      </button>
                    </div>
                  </div>

                  {/* Summary Grid Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-border">
                    <div className="bg-bg/60 p-2.5 rounded-xl border border-border">
                      <p className="text-text-secondary text-[11px]">Basic</p>
                      <p className="text-text-primary font-semibold text-sm">{formatCurrency(p.basic)}</p>
                    </div>
                    <div className="bg-bg/60 p-2.5 rounded-xl border border-border">
                      <p className="text-text-secondary text-[11px]">HRA</p>
                      <p className="text-text-primary font-semibold text-sm">{formatCurrency(p.hra)}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <p className="text-emerald-400 text-[11px] font-medium">Hand Money</p>
                      <p className="text-emerald-400 font-bold text-sm">{formatCurrency(p.allowances?.hand_money || p.allowances?.special || 10000)}</p>
                    </div>
                    <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      <p className="text-amber-400 text-[11px] font-medium">Transaction Fee</p>
                      <p className="text-amber-400 font-bold text-sm">{formatCurrency(p.deductions?.transaction_fee || 250)}</p>
                    </div>
                    <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                      <p className="text-purple-400 text-[11px] font-medium">Monthly Savings</p>
                      <p className="text-purple-400 font-bold text-sm">{formatCurrency(p.deductions?.monthly_savings || p.deductions?.pf || 5000)}</p>
                    </div>
                    <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                      <p className="text-red-400 text-[11px] font-medium">PF Deduction</p>
                      <p className="text-red-400 font-bold text-sm">{formatCurrency(p.deductions?.pf || 0)}</p>
                    </div>
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
