import { useRoute, Link } from "wouter";
import { useGetFamilyMember, useGetMemberVitals, useGetMemberBaseline, useGetMemberHealthSummary } from "@workspace/api-client-react";
import { Activity, Heart, Wind, ChevronLeft, Calendar, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { format } from "date-fns";
import { cn, getStatusColor } from "@/lib/utils";

export default function MemberDetail() {
  const [, params] = useRoute("/member/:id");
  const memberId = parseInt(params?.id || "0");

  const { data: member, isLoading: memberLoading } = useGetFamilyMember(memberId);
  const { data: summary } = useGetMemberHealthSummary(memberId);
  const { data: vitals } = useGetMemberVitals(memberId, { days: 14 });
  const { data: baseline } = useGetMemberBaseline(memberId);

  if (memberLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Member Data...</div>;
  if (!member) return <div className="p-8 text-center text-destructive">Member not found</div>;

  const chartData = vitals?.map(v => ({
    time: format(new Date(v.timestamp), "MMM d"),
    hrv: v.heartRateVariability,
    rhr: v.restingHeartRate,
    spo2: v.spo2
  })).reverse() || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center border border-white/10 shadow-lg">
            <span className="font-display font-bold text-2xl text-foreground">{member.avatarInitials}</span>
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{member.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-muted-foreground">
              <span>{member.relationship} • {member.age} yrs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
              <span className="capitalize flex items-center gap-1">
                <Activity className="w-3 h-3"/> {member.wearableSource.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link href={`/report/${member.id}`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all font-medium text-sm border border-white/5">
              <FileText className="w-4 h-4" /> Clinical Report
            </button>
          </Link>
          {member.guardianViewEnabled && (
            <Link href={`/guardian/${member.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl transition-all font-medium text-sm">
                <Activity className="w-4 h-4" /> Guardian View
              </button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Current Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Overall AI Assessment</span>
                <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border", getStatusColor(summary?.status))}>
                  {summary?.status || 'Unknown'}
                </span>
              </div>
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs text-muted-foreground mb-3">Calculated Baseline (30d)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg HRV</span> <span className="font-medium text-foreground">{baseline?.avgHrv.toFixed(1)} ms</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg RHR</span> <span className="font-medium text-foreground">{baseline?.avgRestingHr.toFixed(1)} bpm</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg SpO2</span> <span className="font-medium text-foreground">{baseline?.avgSpo2.toFixed(1)}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Charts */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> HRV History (14 Days)</h3>
              <div className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">Shaded area = Expected Range</div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                  />
                  {baseline && (
                    <ReferenceArea y1={baseline.avgHrv - baseline.stdHrv} y2={baseline.avgHrv + baseline.stdHrv} fill="hsl(var(--muted))" fillOpacity={0.4} />
                  )}
                  <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-6"><Heart className="w-5 h-5 text-destructive"/> RHR History (14 Days)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                  />
                  {baseline && (
                    <ReferenceArea y1={baseline.avgRestingHr - baseline.stdRestingHr} y2={baseline.avgRestingHr + baseline.stdRestingHr} fill="hsl(var(--muted))" fillOpacity={0.4} />
                  )}
                  <Line type="monotone" dataKey="rhr" name="RHR (bpm)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--destructive))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
