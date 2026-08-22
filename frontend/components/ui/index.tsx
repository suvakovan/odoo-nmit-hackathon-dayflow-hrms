import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────
// Badge
// ──────────────────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return <span className={`badge-${variant}`}>{children}</span>;
}

// ──────────────────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "indigo" | "emerald" | "amber" | "violet" | "red";
}

const colorMap = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatCard({ title, value, subtitle, icon, trend, color = "indigo" }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white font-outfit mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs mt-2 font-medium", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl border", colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Page Header
// ──────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header flex items-start justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Loading Spinner
// ──────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-600 mb-4">{icon}</div>}
      <p className="text-slate-300 font-medium">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Modal
// ──────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card p-6 w-full max-w-md shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white font-outfit mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
