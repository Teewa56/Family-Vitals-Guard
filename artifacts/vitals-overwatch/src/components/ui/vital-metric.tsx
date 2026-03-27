import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VitalMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: "excellent" | "good" | "fair" | "warning" | "critical";
  trend?: "improving" | "stable" | "declining";
  icon?: ReactNode;
  className?: string;
}

export function VitalMetric({ label, value, unit, status = "good", trend, icon, className }: VitalMetricProps) {
  
  const getStatusClasses = () => {
    switch(status) {
      case "excellent": return "border-success/40 text-success glow-success";
      case "good": return "border-success/20 text-success/80";
      case "warning":
      case "fair": return "border-warning/40 text-warning glow-warning";
      case "critical": return "border-destructive/50 text-destructive glow-critical";
      default: return "border-border text-muted-foreground";
    }
  };

  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;

  return (
    <div className={cn("glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          {icon && <span className="opacity-70">{icon}</span>}
          {label}
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full", 
            trend === "improving" ? "bg-success/10 text-success" : 
            trend === "declining" ? "bg-destructive/10 text-destructive" : 
            "bg-muted text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            <span className="capitalize">{trend}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-4xl font-display font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-muted-foreground text-sm font-medium">{unit}</span>}
      </div>

      <div className={cn(
        "absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full border-4 opacity-50 transition-all duration-500 group-hover:scale-110",
        getStatusClasses()
      )} />
    </div>
  );
}
