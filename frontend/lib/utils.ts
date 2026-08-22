export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLeaveStatusBadge(status: string): string {
  switch (status) {
    case "APPROVED":
      return "badge-success";
    case "REJECTED":
      return "badge-danger";
    case "PENDING":
      return "badge-warning";
    default:
      return "badge-neutral";
  }
}

export function getAttendanceStatusBadge(status: string): string {
  switch (status) {
    case "PRESENT":
      return "badge-success";
    case "ABSENT":
      return "badge-danger";
    case "HALF_DAY":
      return "badge-warning";
    case "LEAVE":
      return "badge-info";
    default:
      return "badge-neutral";
  }
}
