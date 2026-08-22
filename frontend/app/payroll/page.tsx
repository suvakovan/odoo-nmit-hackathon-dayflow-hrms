"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { payrollApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Download, Loader2 } from "lucide-react";
import type { SalaryStructure } from "@/lib/types";

export default function PayrollPage() {
  const [salary, setSalary] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    payrollApi.mySalary()
      .then((r) => setSalary(r.data))
      .catch((err) => {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          toast.error("Failed to load salary");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await payrollApi.downloadSlip(month);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip downloaded!");
    } catch {
      toast.error("Failed to generate payslip");
    } finally {
      setDownloading(false);
    }
  };

  const defaultSalary: SalaryStructure = {
    id: 0,
    employee_id: 0,
    basic: 50000,
    hra: 20000,
    allowances: { transport: 5000, medical: 5000, special: 10000 },
    deductions: { pf: 3600, tax: 2400 },
    net_salary: 81400,
    effective_from: new Date().toISOString().slice(0, 10),
    is_active: true,
  };

  const activeSalary = salary || defaultSalary;
  const totalAllowances = Object.values(activeSalary.allowances || {}).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(activeSalary.deductions || {}).reduce((a, b) => a + b, 0);

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Payroll" subtitle={`Effective from ${formatDate(activeSalary.effective_from)}`} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-6">
        {/* Net Salary Hero */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <p className="text-text-secondary text-sm mb-2">Monthly Net Salary</p>
          <p className="text-5xl font-bold font-outfit gradient-text">{formatCurrency(activeSalary.net_salary)}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="text-xs text-text-secondary uppercase font-semibold mb-3">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Basic</span>
                <span className="text-text-primary font-medium">{formatCurrency(activeSalary.basic)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">HRA</span>
                <span className="text-text-primary font-medium">{formatCurrency(activeSalary.hra)}</span>
              </div>
              {Object.entries(activeSalary.allowances || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-text-secondary capitalize">{k.replace("_", " ")}</span>
                  <span className="text-text-primary font-medium">{formatCurrency(v)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border font-semibold">
                <span className="text-emerald-500">Total Earnings</span>
                <span className="text-emerald-500">{formatCurrency(Number(activeSalary.basic) + Number(activeSalary.hra) + totalAllowances)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-xs text-text-secondary uppercase font-semibold mb-3">Deductions</h3>
            <div className="space-y-2">
              {Object.entries(activeSalary.deductions || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-text-secondary capitalize">{k.replace("_", " ")}</span>
                  <span className="text-text-primary font-medium">{formatCurrency(v)}</span>
                </div>
              ))}
              {Object.keys(activeSalary.deductions || {}).length === 0 && (
                <p className="text-text-secondary text-sm">No deductions</p>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-border font-semibold">
                <span className="text-red-500">Total Deductions</span>
                <span className="text-red-500">{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Download Payslip */}
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <p className="text-text-primary font-semibold mb-1">Download Payslip</p>
          <div className="flex items-center gap-2">
            <label className="text-text-secondary text-sm">Month:</label>
            <input
              type="month"
              id="payslip-month"
              className="form-input py-1 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>
        <button
          id="download-payslip-btn"
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary flex items-center gap-2"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
