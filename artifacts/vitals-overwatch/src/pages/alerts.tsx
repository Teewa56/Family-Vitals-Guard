import { useState } from "react";
import { useListAlerts, useResolveAlert, useGetDashboardOverview } from "@workspace/api-client-react";
import { ShieldAlert, CheckCircle, Clock, Filter, AlertTriangle, Activity } from "lucide-react";
import { formatRelative, getSeverityColor, cn } from "@/lib/utils";
import { AnomalyBadge } from "@/components/ui/anomaly-badge";
import { useQueryClient } from "@tanstack/react-query";
import { getListAlertsQueryKey, getGetDashboardOverviewQueryKey } from "@workspace/api-client-react";

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useListAlerts({ 
    resolved: filter === "active" ? false : filter === "resolved" ? true : undefined 
  });
  
  const resolveMutation = useResolveAlert({
    mutation: {
      onSuccess: () => {
        // Invalidate queries to refresh lists and dashboard counts
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      }
    }
  });

  const handleResolve = (id: number) => {
    resolveMutation.mutate({ alertId: id });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-warning" /> 
            System Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Review and manage AI-detected biometric anomalies.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setFilter("active")}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", filter === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter("all")}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("resolved")}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", filter === "resolved" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Resolved
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">Loading alerts...</div>
      ) : alerts?.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border-dashed border-white/10 flex flex-col items-center">
          <ShieldAlert className="w-16 h-16 text-success opacity-50 mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground">No {filter !== "all" ? filter : ""} alerts found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">Your family's biometric baselines are stable. The AI engine is actively monitoring for subtle deviations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts?.map(alert => (
            <div key={alert.id} className={cn(
              "glass-panel p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden",
              alert.resolved ? "opacity-60 border-white/5" : 
              alert.severity === "critical" ? "border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/10"
            )}>
              {!alert.resolved && alert.severity === "critical" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              )}
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("px-2.5 py-1 text-[10px] uppercase font-bold rounded-md border tracking-wider", getSeverityColor(alert.severity))}>
                      {alert.severity}
                    </span>
                    <span className="font-display font-semibold text-foreground bg-white/5 px-2 py-0.5 rounded text-sm">
                      {alert.memberName}
                    </span>
                    <AnomalyBadge type={alert.alertType} />
                  </div>
                  
                  <h3 className={cn("text-lg font-bold mt-2", alert.resolved ? "text-muted-foreground" : "text-foreground")}>
                    {alert.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Detected {formatRelative(alert.detectedAt)}</span>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {alert.deviationPercent}% Deviation from baseline</span>
                    
                    {alert.resolved && alert.resolvedAt && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1.5 text-success/80"><CheckCircle className="w-3.5 h-3.5" /> Resolved {formatRelative(alert.resolvedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {!alert.resolved && (
                  <div className="flex items-center md:border-l md:border-white/10 md:pl-6">
                    <button 
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolveMutation.isPending}
                      className="w-full md:w-auto px-6 py-3 bg-success/10 hover:bg-success/20 text-success border border-success/20 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {resolveMutation.isPending ? "Resolving..." : <><CheckCircle className="w-5 h-5" /> Mark Resolved</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
