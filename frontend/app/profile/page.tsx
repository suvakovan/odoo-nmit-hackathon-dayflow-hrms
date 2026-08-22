"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { employeeApi, payrollApi } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/ui";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { User, Phone, MapPin, Save, Loader2, FileText, Upload, Trash2, Lock, ExternalLink, Briefcase, DollarSign, ShieldCheck } from "lucide-react";
import type { Employee, SalaryStructure } from "@/lib/types";

interface DocumentItem {
  id: number;
  file_url: string;
  doc_type: string;
  uploaded_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "", profile_picture_url: "" });

  const [activeTab, setActiveTab] = useState<"info" | "job" | "salary" | "documents">("info");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docType, setDocType] = useState("ID_PROOF");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = (empId: number) => {
    employeeApi.getDocuments(empId)
      .then((r) => setDocuments(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      employeeApi.getMe(),
      payrollApi.mySalary().catch(() => ({ data: null })),
    ])
      .then(([empRes, salRes]) => {
        setProfile(empRes.data);
        setSalary(salRes.data);
        setForm({
          phone: empRes.data.phone || "",
          address: empRes.data.address || "",
          profile_picture_url: empRes.data.profile_picture_url || "",
        });
        fetchDocuments(empRes.data.id);
      })
      .catch((err) => {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          toast.error("Failed to load profile");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await employeeApi.updateMe(form);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    setUploading(true);
    try {
      await employeeApi.uploadDocument(profile.id, selectedFile, docType);
      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      const fileInput = document.getElementById("doc-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchDocuments(profile.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!profile) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await employeeApi.deleteDocument(profile.id, docId);
      toast.success("Document deleted successfully");
      fetchDocuments(profile.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Deletion failed");
    }
  };

  const isDeletionAllowed = (uploadedAt: string) => {
    const uploadTime = new Date(uploadedAt).getTime();
    const now = new Date().getTime();
    return (now - uploadTime) < 24 * 60 * 60 * 1000;
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "ID_PROOF":
        return "ID Proof";
      case "QUALIFICATION":
        return "Qualification";
      case "CONTRACT":
        return "Contract";
      default:
        return "Other";
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" />;
  if (!profile) return null;

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader title="My Profile" subtitle={`Employee Code: ${profile.employee_code}`} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("info")}
          id="tab-profile-info"
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "info"
              ? "bg-indigo-500/10 text-accent border border-indigo-500/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <User className="w-3.5 h-3.5" /> Personal Info
        </button>
        <button
          onClick={() => setActiveTab("job")}
          id="tab-profile-job"
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "job"
              ? "bg-indigo-500/10 text-accent border border-indigo-500/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Briefcase className="w-3.5 h-3.5" /> Job Details
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          id="tab-profile-salary"
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "salary"
              ? "bg-indigo-500/10 text-accent border border-indigo-500/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <DollarSign className="w-3.5 h-3.5" /> Salary Structure
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          id="tab-profile-docs"
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "documents"
              ? "bg-indigo-500/10 text-accent border border-indigo-500/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <FileText className="w-3.5 h-3.5" /> Documents
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Avatar & Basic Details Card */}
        <div className="md:col-span-1">
          <div className="glass-card p-6 text-center flex flex-col items-center">
            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20 mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20 mb-4">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
            )}
            <h2 className="text-xl font-bold text-text-primary font-outfit">{profile.first_name} {profile.last_name}</h2>
            <p className="text-xs text-accent font-mono mt-0.5">{profile.employee_code}</p>
            
            <div className="w-full border-t border-border my-4 pt-4 text-left space-y-2 text-xs text-text-secondary">
              <div>
                <span className="text-text-secondary block">Email</span>
                <span className="text-text-primary font-medium">{profile.email || `${profile.first_name.toLowerCase()}@company.com`}</span>
              </div>
              <div>
                <span className="text-text-secondary block">Joining Date</span>
                <span className="text-text-primary font-medium">{formatDate(profile.joining_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="md:col-span-2">
          {activeTab === "info" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-6">
              <h3 className="text-lg font-bold text-text-primary font-outfit">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-text-secondary" /> Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-text-secondary" /> Address
                  </label>
                  <textarea
                    id="profile-address"
                    className="form-input resize-none"
                    rows={3}
                    placeholder="Your home address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-text-secondary" /> Profile Picture URL
                  </label>
                  <input
                    id="profile-picture-url"
                    type="url"
                    className="form-input"
                    placeholder="https://…"
                    value={form.profile_picture_url}
                    onChange={(e) => setForm((f) => ({ ...f, profile_picture_url: e.target.value }))}
                  />
                </div>
              </div>

              <button
                id="save-profile-btn"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 mt-4"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </motion.div>
          )}

          {activeTab === "job" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-6">
              <h3 className="text-lg font-bold text-text-primary font-outfit flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" /> Job & Organizational Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-bg/60 p-4 rounded-xl border border-border">
                  <span className="text-text-secondary block mb-1">Employee Code</span>
                  <span className="text-text-primary font-semibold text-sm">{profile.employee_code}</span>
                </div>
                <div className="bg-bg/60 p-4 rounded-xl border border-border">
                  <span className="text-text-secondary block mb-1">Department</span>
                  <span className="text-text-primary font-semibold text-sm font-outfit">Engineering / HR Operations</span>
                </div>
                <div className="bg-bg/60 p-4 rounded-xl border border-border">
                  <span className="text-text-secondary block mb-1">Joining Date</span>
                  <span className="text-text-primary font-semibold text-sm">{formatDate(profile.joining_date)}</span>
                </div>
                <div className="bg-bg/60 p-4 rounded-xl border border-border">
                  <span className="text-text-secondary block mb-1">Employment Status</span>
                  <span className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-4 h-4" /> Full-Time Active
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "salary" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-6">
              <h3 className="text-lg font-bold text-text-primary font-outfit flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Monthly Salary Breakdown
              </h3>
              
              {salary ? (
                <div className="space-y-4">
                  <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 text-center">
                    <p className="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Monthly Net Salary</p>
                    <p className="text-3xl font-extrabold text-white font-outfit">{formatCurrency(salary.net_salary)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-bg/60 p-3 rounded-xl border border-border">
                      <span className="text-text-secondary block">Basic Salary</span>
                      <span className="text-text-primary font-semibold text-sm">{formatCurrency(salary.basic)}</span>
                    </div>
                    <div className="bg-bg/60 p-3 rounded-xl border border-border">
                      <span className="text-text-secondary block">HRA</span>
                      <span className="text-text-primary font-semibold text-sm">{formatCurrency(salary.hra)}</span>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <span className="text-emerald-400 block font-medium">Hand Money</span>
                      <span className="text-emerald-400 font-bold text-sm">{formatCurrency(salary.allowances?.hand_money || 10000)}</span>
                    </div>
                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <span className="text-amber-400 block font-medium">Transaction Fee</span>
                      <span className="text-amber-400 font-bold text-sm">{formatCurrency(salary.deductions?.transaction_fee || 250)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-text-secondary text-sm text-center py-6">
                  No salary structure record found.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Document Upload Form */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-text-primary font-outfit mb-4">Upload Document</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Document Type</label>
                      <select
                        id="doc-type-select"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="form-input"
                      >
                        <option value="ID_PROOF">ID Proof (Aadhar/Passport)</option>
                        <option value="QUALIFICATION">Qualification/Certificate</option>
                        <option value="CONTRACT">Employment Contract</option>
                        <option value="OTHER">Other Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Select File (PDF, JPG, PNG - Max 5MB)</label>
                      <input
                        type="file"
                        id="doc-file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="form-input text-xs"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    id="upload-doc-btn"
                    disabled={uploading}
                    className="btn-primary flex items-center gap-2 w-full justify-center sm:w-auto mt-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Document
                  </button>
                </form>
              </div>

              {/* Uploaded Documents List */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-text-primary font-outfit mb-4">My Documents</h3>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-secondary">
                          <th className="py-2.5">Document Type</th>
                          <th className="py-2.5">Uploaded Date</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-text-primary">
                        {documents.map((doc) => {
                          const deletionAllowed = isDeletionAllowed(doc.uploaded_at);
                          // Prefix backend base URL if file_url is a relative path
                          const downloadUrl = doc.file_url.startsWith("http")
                            ? doc.file_url
                            : `http://localhost:8000${doc.file_url}`;

                          return (
                            <tr key={doc.id} className="hover:bg-slate-800/10">
                              <td className="py-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                <span className="font-semibold text-white">{getDocTypeLabel(doc.doc_type)}</span>
                              </td>
                              <td className="py-3 text-slate-400">
                                {formatDate(doc.uploaded_at)}
                              </td>
                              <td className="py-3 text-right flex items-center justify-end gap-2">
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                  title="View/Download"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                {deletionAllowed ? (
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span
                                    className="p-1.5 rounded bg-slate-950/20 text-slate-600 cursor-not-allowed flex items-center justify-center"
                                    title="Cannot delete after 24 hours"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
