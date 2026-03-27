import { Link } from "wouter";
import { useGetDashboardOverview, type DashboardOverview, type MemberHealthCard } from "@workspace/api-client-react";
import { Activity, ShieldAlert, Heart, Wind, ChevronRight, AlertTriangle, Users } from "lucide-react";
import { cn, getStatusColor, formatRelative } from "@/lib/utils";
import { AnomalyBadge } from "@/components/ui/anomaly-badge";
import { motion } from "framer-motion";

function FamilyMemberCard({ card }: { card: MemberHealthCard }) {
  const isCritical = card.summary.status === "critical";

  return (
    <div className={cn(
      "glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden",
      isCritical ? "border-destructive/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "hover:border-primary/30 hover:shadow-primary/5"
    )}>
      {isCritical && (
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/10 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center border border-white/10 shadow-inner">
              <span className="font-display font-bold text-lg text-foreground">{card.member.avatarInitials}</span>
            </div>
            {card.activeAlertCount > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-destructive/50 animate-pulse">
                {card.activeAlertCount}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              {card.member.name}
              {card.member.isHighRisk && <ShieldAlert className="w-4 h-4 text-warning" />}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{card.member.relationship}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold border", getStatusColor(card.summary.status))}>
                {card.summary.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> HRV</span>
          <span className="font-display font-bold text-xl text-foreground">
            {card.latestReading?.heartRateVariability ? Math.round(card.latestReading.heartRateVariability) : '--'}
            <span className="text-xs font-normal text-muted-foreground ml-1">ms</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Heart className="w-3 h-3"/> RHR</span>
          <span className="font-display font-bold text-xl text-foreground">
            {card.latestReading?.restingHeartRate ? Math.round(card.latestReading.restingHeartRate) : '--'}
            <span className="text-xs font-normal text-muted-foreground ml-1">bpm</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wind className="w-3 h-3"/> SpO2</span>
          <span className="font-display font-bold text-xl text-foreground">
            {card.latestReading?.spo2 ? Math.round(card.latestReading.spo2) : '--'}
            <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
          </span>
        </div>
      </div>

      {card.latestReading?.anomalyFlags && card.latestReading.anomalyFlags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
          {card.latestReading.anomalyFlags.map(flag => (
            <AnomalyBadge key={flag} type={flag} />
          ))}
        </div>
      )}

      <div className="flex gap-3 relative z-10 mt-auto pt-4 border-t border-white/5">
        <Link 
          href={`/member/${card.member.id}`}
          className="flex-1 text-center py-2 text-sm font-medium text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          View Details
        </Link>
        {card.member.guardianViewEnabled && (
          <Link 
            href={`/guardian/${card.member.id}`}
            className="flex-1 text-center py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
          >
            Guardian View
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboardOverview();

  if (isLoading) {
    return (
      <div className="p-8 w-full h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Syncing family vitals...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 w-full h-full flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4 opacity-50" />
        <h2 className="text-xl font-display font-bold text-foreground">Unable to load dashboard</h2>
        <p className="text-muted-foreground mt-2">Could not connect to the health intelligence server.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">Family Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">AI monitoring active across {data.totalMembers} members.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-3 rounded-xl border border-white/5 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              <span className="font-medium text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                System Nominal
              </span>
            </div>
          </div>
          <div className={cn(
            "glass-panel px-4 py-3 rounded-xl border flex items-center gap-4",
            data.criticalAlerts > 0 ? "border-destructive/30 bg-destructive/5" : "border-white/5"
          )}>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</span>
              <span className={cn("font-bold text-xl leading-none", data.criticalAlerts > 0 ? "text-destructive" : "text-foreground")}>
                {data.criticalAlerts}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2 border-b border-white/5 pb-2">
            <Users className="w-5 h-5 text-primary" /> Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.familyCards.map((card, idx) => (
              <motion.div 
                key={card.member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <FamilyMemberCard card={card} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> Recent Alerts
            </h2>
            <Link href="/alerts" className="text-sm text-primary hover:underline flex items-center">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {data.recentAlerts.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center border-dashed border-white/10">
                <ShieldAlert className="w-10 h-10 text-success opacity-50 mx-auto mb-3" />
                <p className="text-muted-foreground">No active alerts.</p>
                <p className="text-sm text-muted-foreground/70">Family vitals are stable.</p>
              </div>
            ) : (
              data.recentAlerts.slice(0, 5).map(alert => (
                <Link href={`/member/${alert.memberId}`} key={alert.id}>
                  <div className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", alert.severity === "critical" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-warning")} />
                        <span className="font-medium text-sm text-foreground">{alert.memberName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatRelative(alert.detectedAt)}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
