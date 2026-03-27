import { AlertTriangle, Activity, Wind, Moon, Thermometer, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnomalyBadgeProps {
  type: string;
  className?: string;
}

export function AnomalyBadge({ type, className }: AnomalyBadgeProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case "hrv_drop":
        return { icon: Activity, label: "HRV Drop", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" };
      case "elevated_hr":
        return { icon: Activity, label: "Elevated HR", color: "text-red-400 bg-red-400/10 border-red-400/20" };
      case "low_spo2":
        return { icon: Wind, label: "Low SpO2", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
      case "sleep_disruption":
        return { icon: Moon, label: "Poor Sleep", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
      case "temperature_spike":
        return { icon: Thermometer, label: "Temp Spike", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" };
      case "combined_stress":
        return { icon: ShieldAlert, label: "Combined Stress", color: "text-destructive bg-destructive/10 border-destructive/30 glow-critical" };
      default:
        return { icon: AlertTriangle, label: type.replace('_', ' '), color: "text-muted-foreground bg-muted border-border" };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", config.color, className)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{config.label}</span>
    </div>
  );
}
