"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { employeeApi } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { User, Phone, MapPin, Save, Loader2 } from "lucide-react";
import type { Employee } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "", profile_picture_url: "" });

  useEffect(() => {
    employeeApi.getMe()
      .then((r) => {
        setProfile(r.data);
        setForm({ phone: r.data.phone || "", address: r.data.address || "", profile_picture_url: r.data.profile_picture_url || "" });
      })
      .catch(() => toast.error("Failed to load profile"))
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

  if (loading) return <Spinner className="min-h-[60vh]" />;
  if (!profile) return null;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="My Profile" subtitle={`Employee Code: ${profile.employee_code}`} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-outfit">{profile.first_name} {profile.last_name}</h2>
            <p className="text-indigo-400 font-medium">{profile.designation}</p>
            <p className="text-slate-400 text-sm">{profile.department} · Joined {formatDate(profile.joining_date)}</p>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-6 space-y-5">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Editable Fields</p>

          <div>
            <label className="form-label flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone Number
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
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> Address
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
              <User className="w-3.5 h-3.5 text-slate-500" /> Profile Picture URL
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

          <div className="border-t border-white/[0.08] pt-4 grid grid-cols-2 gap-3 text-sm text-slate-400">
            <div><p className="text-slate-500 text-xs">Email</p><p className="text-white">{profile.first_name.toLowerCase()}.{profile.last_name.toLowerCase()}@company.com</p></div>
            <div><p className="text-slate-500 text-xs">Department</p><p className="text-white">{profile.department}</p></div>
          </div>

          <button id="save-profile-btn" onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
