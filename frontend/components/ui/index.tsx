import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────
// Badge
// ──────────────────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
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
  indigo: "bg-primary/10 text-primary border-primary/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  violet: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function StatCard({ title, value, subtitle, icon, trend, color = "indigo" }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-text-primary font-outfit mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs mt-2 font-medium", trend.value >= 0 ? "text-success" : "text-danger")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl border shadow-sm", colorMap[color])}>
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
    <div className="page-header flex items-start justify-between mb-6">
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
      <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-text-secondary opacity-60 mb-3">{icon}</div>}
      <p className="text-text-primary font-semibold text-sm">{title}</p>
      {subtitle && <p className="text-text-secondary text-xs mt-1">{subtitle}</p>}
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
      <div
        className="relative bg-surface border border-border text-text-primary p-6 w-full max-w-md rounded-2xl shadow-2xl animate-fade-in z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-text-primary font-outfit mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
