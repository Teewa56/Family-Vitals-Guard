import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "MMM d, yyyy h:mm a");
}

export function formatRelative(dateString: string | undefined | null) {
  if (!dateString) return "Unknown time";
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function getStatusColor(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case "excellent":
    case "good":
      return "text-success border-success/30 bg-success/10";
    case "fair":
    case "warning":
    case "medium":
    case "high":
      return "text-warning border-warning/30 bg-warning/10";
    case "critical":
      return "text-destructive border-destructive/30 bg-destructive/10";
    default:
      return "text-muted-foreground border-border bg-muted/50";
  }
}

export function getSeverityColor(severity: string | undefined) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "text-destructive border-destructive/50 bg-destructive/10";
    case "high":
      return "text-warning border-warning/50 bg-warning/10";
    case "medium":
      return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
    case "low":
      return "text-primary border-primary/50 bg-primary/10";
    default:
      return "text-muted-foreground border-border bg-muted";
  }
}
