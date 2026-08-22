"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { employeeApi } from "@/lib/api";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Search, Users, Building2 } from "lucide-react";
import type { Employee } from "@/lib/types";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.list({
        search: search || undefined,
      });
      setEmployees(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        toast.error("Failed to load employees");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} total`}
        actions={
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Users className="w-4 h-4" />
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            id="employee-search"
            type="text"
            placeholder="Search by name or code…"
            className="form-input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" subtitle="Try adjusting your search query." icon={<Users className="w-10 h-10" />} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-xs text-accent">{emp.employee_code}</span></td>
                  <td className="text-text-secondary text-sm">{formatDate(emp.joining_date)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
