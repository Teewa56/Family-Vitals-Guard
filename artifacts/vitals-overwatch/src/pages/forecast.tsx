import { useRoute } from "wouter";
import { useGetBiometricForecast, useListFamilyMembers } from "@workspace/api-client-react";
import { Clock, AlertTriangle, ShieldAlert, Activity, Heart, Wind, Zap, BrainCircuit, Info, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import { format, addHours } from "date-fns";
import { formatRelative } from "@/lib/utils";

function DataQualityBadge({ quality }: { quality: string | undefined }) {
  if (!quality) return null;
  const colors = {
    excellent: "bg-success/20 text-success border-success/30",
    good: "bg-primary/20 text-primary border-primary/30",
    marginal: "bg-warning/20 text-warning border-warning/30",
    insufficient: "bg-destructive/20 text-destructive border-destructive/30"
  };
  const colorClass = colors[quality as keyof typeof colors] || colors.marginal;
  
  return (
    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${colorClass}`}>
      <Activity className="w-3 h-3" /> Data: {quality}
    </div>
  );
}

function RiskBadge({ risk }: { risk: string | undefined }) {
  if (!risk) return null;
  const colors = {
    low: "bg-success/20 text-success border-success/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    moderate: "bg-warning/20 text-warning border-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    elevated: "bg-orange-500/20 text-orange-500 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
    high: "bg-destructive/20 text-destructive border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
  };
  const colorClass = colors[risk as keyof typeof colors] || colors.low;
  
  return (
    <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border flex items-center gap-2 ${colorClass}`}>
      <ShieldAlert className="w-4 h-4" /> Risk: {risk}
    </div>
  );
}

export default function ForecastPage() {
  const [, params] = useRoute("/forecast/:id");
  const memberId = params?.id ? Number(params.id) : 1;
  const [horizon, setHorizon] = useState(48);
  const [activeMetric, setActiveMetric] = useState<'hrv' | 'rhr' | 'spo2'>('hrv');

  const { data: members } = useListFamilyMembers();
  const currentMember = members?.find(m => m.id === memberId);

  const { data, isLoading, isError } = useGetBiometricForecast(memberId, { horizonHours: horizon });

  const chartData = useMemo(() => {
    if (!data?.timeline) return [];
    return data.timeline.map(p => ({
      ...p,
      timeLabel: format(new Date(p.timestamp), "EEE ha"),
      isForecast: !p.isHistory,
      hrvBandWidth: p.hrvUpper - p.hrvLower,
      hrBandWidth: p.hrUpper - p.hrLower,
      spo2BandWidth: p.spo2Upper - p.spo2Lower,
    }));
  }, [data]);

  const nowTimestamp = useMemo(() => {
    const nowPoint = chartData.find(p => p.isForecast);
    return nowPoint ? nowPoint.timeLabel : null;
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center flex-col space-y-4">
        <div className="relative">
          <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>
        <p className="text-primary font-display font-medium tracking-widest uppercase animate-pulse">Computing Future Biometrics...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-display font-bold">Temporal Computation Failed</h2>
        <p className="text-muted-foreground mt-2">Could not retrieve forecast data.</p>
      </div>
    );
  }

  if (data.dataQuality === "insufficient") {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Activity className="w-16 h-16 text-destructive opacity-50" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">Insufficient Data</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          The AI engine requires at least 5 days of continuous wearable data to build an accurate predictive model for {currentMember?.name || "this member"}.
        </p>
        <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full mt-4 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all">
          Connect Wearable Device
        </button>
      </div>
    );
  }

  const metricConfig = {
    hrv: { label: "HRV (ms)", key: "hrv", lowerKey: "hrvLower", bandKey: "hrvBandWidth", color: "var(--primary)", icon: Activity },
    rhr: { label: "Resting HR (bpm)", key: "restingHr", lowerKey: "hrLower", bandKey: "hrBandWidth", color: "var(--destructive)", icon: Heart },
    spo2: { label: "SpO2 (%)", key: "spo2", lowerKey: "spo2Lower", bandKey: "spo2BandWidth", color: "var(--accent)", icon: Wind },
  };

  const activeConf = metricConfig[activeMetric];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Clock className="w-6 h-6" />
            <span className="font-display font-bold uppercase tracking-widest text-sm">Biometric Time-Travel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground flex items-center gap-4">
            {currentMember?.name || "Member"} Forecast
            <ChevronDown className="w-6 h-6 text-muted-foreground cursor-pointer hover:text-foreground" />
          </h1>
          <p className="text-muted-foreground text-lg">AI-powered forward-looking health intelligence.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <DataQualityBadge quality={data.dataQuality} />
            <RiskBadge risk={data.overallRisk} />
          </div>
          
          <div className="bg-black/40 p-1 rounded-lg border border-white/10 flex">
            {[24, 48, 72].map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${horizon === h ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Chart Section */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex gap-4">
            {Object.entries(metricConfig).map(([key, conf]) => {
              const Icon = conf.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMetric(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeMetric === key ? 'bg-white/10 border-white/20 text-foreground shadow-inner' : 'border-transparent text-muted-foreground hover:bg-white/5'}`}
                >
                  <Icon className={`w-4 h-4 ${activeMetric === key ? `text-[hsl(${conf.color})]` : ''}`} style={activeMetric === key ? { color: `hsl(${conf.color})` } : {}} />
                  <span className="font-semibold">{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[450px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={`hsl(${activeConf.color})`} stopOpacity={0.1}/>
                  <stop offset="100%" stopColor={`hsl(${activeConf.color})`} stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
              />
              
              {nowTimestamp && (
                <ReferenceLine x={nowTimestamp} stroke="hsl(var(--foreground))" strokeWidth={2} opacity={0.5}>
                  <Label position="top" value="NOW" fill="hsl(var(--foreground))" fontSize={12} fontWeight="bold" />
                </ReferenceLine>
              )}

              {/* Confidence Band — stacked areas create lower-to-upper band */}
              <Area
                type="monotone"
                dataKey={activeConf.lowerKey}
                stroke="none"
                fill="transparent"
                stackId="band"
                connectNulls
                dot={false}
              />
              <Area
                type="monotone"
                dataKey={activeConf.bandKey}
                stroke="none"
                fill="url(#forecastBand)"
                stackId="band"
                connectNulls
                dot={false}
              />

              {/* History line — solid */}
              <Line
                type="monotone"
                dataKey={activeConf.key}
                stroke={`hsl(${activeConf.color})`}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: `hsl(${activeConf.color})`, stroke: 'black', strokeWidth: 2 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Events and Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Predicted Events */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> Predicted Events
          </h2>
          
          <div className="space-y-4">
            {data.predictedEvents?.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 text-success opacity-50 mb-3" />
                <p className="text-lg font-medium text-foreground">No events predicted</p>
                <p className="text-muted-foreground">The forecast looks clear for the next {horizon} hours.</p>
              </div>
            ) : (
              data.predictedEvents?.map((event, idx) => {
                const getGlow = (prob: number) => {
                  if (prob >= 60) return "border-destructive/40 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-destructive/5";
                  if (prob >= 40) return "border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/5";
                  return "border-warning/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-warning/5";
                };

                const getIcon = (type: string) => {
                  switch(type) {
                    case 'infection': return '🦠';
                    case 'respiratory': return '💨';
                    case 'cardiac': return '❤️';
                    case 'burnout': return '🔥';
                    default: return '⚠️';
                  }
                };

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className={`glass-panel p-6 rounded-2xl border relative overflow-hidden ${getGlow(event.probability)}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{getIcon(event.type)}</div>
                        <div>
                          <h3 className="text-xl font-display font-bold text-foreground">{event.label}</h3>
                          <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4" /> Expected onset: {formatRelative(event.expectedOnset)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-display font-bold tracking-tighter">
                          {event.probability}%
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                          Probability
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-foreground/90 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                      {event.description}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1 text-muted-foreground uppercase tracking-wider">
                        <Activity className="w-4 h-4" /> Primary Signals
                      </h4>
                      <ul className="flex flex-wrap gap-2">
                        {event.warningSignals.map((sig, i) => (
                          <li key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-foreground/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive/80" /> {sig}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" /> AI Analysis
          </h2>
          
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden font-mono text-sm shadow-xl">
            <div className="bg-black/60 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <span className="text-muted-foreground text-xs">vitals-engine-v4.2.1</span>
            </div>
            <div className="p-5 space-y-4 bg-[#0A0A0A] text-success/90">
              <div>
                <span className="text-primary/70">{'>'} TREND_SUMMARY</span>
                <p className="mt-2 text-foreground/90 leading-relaxed font-sans">{data.trendSummary}</p>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <span className="text-primary/70">{'>'} METHODOLOGY</span>
                <p className="mt-2 text-muted-foreground leading-relaxed text-xs">
                  {data.methodology}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-primary/50 animate-pulse mt-4">
                <span className="block w-2 h-4 bg-primary/50" /> Computing next epoch...
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

