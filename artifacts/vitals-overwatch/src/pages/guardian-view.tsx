import { useRoute, Link } from "wouter";
import { useGetFamilyMember, useGetMemberVitals, useGetMemberBaseline, useGetMemberHealthSummary, useGenerateBaselineReport } from "@workspace/api-client-react";
import { VitalMetric } from "@/components/ui/vital-metric";
import { Activity, Heart, Wind, Share2, Printer, ChevronLeft, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { format } from "date-fns";
import { AnomalyBadge } from "@/components/ui/anomaly-badge";
import { cn } from "@/lib/utils";

export default function GuardianView() {
  const [, params] = useRoute("/guardian/:id");
  const memberId = parseInt(params?.id || "0");

  const { data: member } = useGetFamilyMember(memberId);
  const { data: summary } = useGetMemberHealthSummary(memberId);
  const { data: vitals } = useGetMemberVitals(memberId, { days: 7 });
  const { data: baseline } = useGetMemberBaseline(memberId);

  if (!member || !summary) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Guardian Link...</div>;

  const latest = summary.latestReading;
  const isCritical = summary.status === "critical";

  const chartData = vitals?.map(v => ({
    time: format(new Date(v.timestamp), "MMM d HH:mm"),
    hrv: v.heartRateVariability,
    rhr: v.restingHeartRate,
    spo2: v.spo2,
    isAnomaly: v.anomalyScore && v.anomalyScore > 0.8
  })).reverse() || [];

  return (
    <div className="h-full flex flex-col bg-background relative overflow-y-auto">
      {isCritical && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive shadow-[0_0_20px_rgba(239,68,68,0.8)] z-50 animate-pulse" />
      )}
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">{member.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  Guardian Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{member.age} yrs • Wearable: <span className="capitalize text-foreground">{member.wearableSource.replace('_', ' ')}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/report/${member.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground text-sm font-medium rounded-lg border border-white/10 transition-all">
                <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Baseline Report</span>
              </button>
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg border border-primary/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share to Doctor</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Urgent Status Banner */}
        {isCritical && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="p-3 bg-destructive/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Critical Deviation Detected</h2>
              <p className="text-muted-foreground mt-1">
                AI baseline analysis indicates a significant drop in HRV coupled with elevated resting heart rate over the past 48 hours. This pattern often precedes clinical symptoms.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {latest?.anomalyFlags.map(f => <AnomalyBadge key={f} type={f} />)}
              </div>
            </div>
          </div>
        )}

        {/* Large Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VitalMetric 
            label="Heart Rate Variability" 
            value={Math.round(latest?.heartRateVariability || 0)} 
            unit="ms" 
            icon={<Activity className="w-4 h-4"/>}
            trend={summary.trendHrv}
            status={summary.trendHrv === 'declining' ? 'warning' : 'good'}
            className="md:col-span-1"
          />
          <VitalMetric 
            label="Resting Heart Rate" 
            value={Math.round(latest?.restingHeartRate || 0)} 
            unit="bpm" 
            icon={<Heart className="w-4 h-4"/>}
            trend={summary.trendHr}
            status={summary.trendHr === 'declining' ? 'warning' : 'good'}
            className="md:col-span-1"
          />
          <VitalMetric 
            label="Blood Oxygen (SpO2)" 
            value={Math.round(latest?.spo2 || 0)} 
            unit="%" 
            icon={<Wind className="w-4 h-4"/>}
            status={latest && latest.spo2 < 95 ? 'critical' : 'good'}
            className="md:col-span-1"
          />
        </div>

        {/* Live Chart area */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-foreground">AI Baseline vs Live Readings (7 Days)</h3>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><div className="w-3 h-3 bg-primary rounded-full"></div> HRV</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><div className="w-3 h-3 bg-white/10 border border-white/20 rounded-md"></div> Expected Baseline</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                {baseline && (
                  <ReferenceArea 
                    y1={baseline.avgHrv - baseline.stdHrv} 
                    y2={baseline.avgHrv + baseline.stdHrv} 
                    fill="hsl(var(--muted))" 
                    fillOpacity={0.3} 
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="hrv" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isAnomaly) {
                      return <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="none" className="animate-pulse" />;
                    }
                    return <circle cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
