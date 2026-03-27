import { useRoute, Link } from "wouter";
import { useGenerateBaselineReport } from "@workspace/api-client-react";
import { ChevronLeft, Printer, Activity, Calendar, ShieldCheck, HeartPulse } from "lucide-react";
import { format } from "date-fns";
import { AnomalyBadge } from "@/components/ui/anomaly-badge";
import { cn, getSeverityColor } from "@/lib/utils";

export default function BaselineReportView() {
  const [, params] = useRoute("/report/:id");
  const memberId = parseInt(params?.id || "0");

  const { data: report, isLoading, isError } = useGenerateBaselineReport(memberId, { days: 30 });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse">Compiling clinical data...</p>
    </div>
  );

  if (isError || !report) return <div className="p-8 text-center text-destructive">Failed to generate report</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Non-printable UI Controls */}
      <div className="print:hidden sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/member/${memberId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to Profile
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="max-w-4xl mx-auto p-8 mt-8 bg-card rounded-xl border border-white/10 shadow-2xl print:shadow-none print:border-none print:m-0 print:p-0 print:bg-white print:text-black">
        
        {/* Report Header */}
        <header className="border-b border-border pb-6 mb-8 flex justify-between items-start print:border-gray-300">
          <div>
            <div className="flex items-center gap-2 text-primary print:text-blue-700 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-display font-bold text-xl tracking-tight uppercase">Vitals Overwatch</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground print:text-black">Clinical Baseline Report</h1>
            <p className="text-muted-foreground print:text-gray-600 mt-1">Generated: {format(new Date(report.reportGeneratedAt), "MMMM d, yyyy 'at' h:mm a")}</p>
          </div>
          <div className="text-right space-y-1 text-sm">
            <p><span className="text-muted-foreground print:text-gray-500">Patient:</span> <span className="font-bold text-foreground print:text-black text-lg">{report.memberName}</span></p>
            <p><span className="text-muted-foreground print:text-gray-500">Age:</span> <span className="font-medium text-foreground print:text-black">{report.memberAge}</span></p>
            <p><span className="text-muted-foreground print:text-gray-500">Data Source:</span> <span className="capitalize font-medium text-foreground print:text-black">{report.wearableSource.replace('_', ' ')}</span></p>
            <p><span className="text-muted-foreground print:text-gray-500">Analysis Period:</span> <span className="font-medium text-foreground print:text-black">Last {report.reportPeriodDays} days</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Baseline Statistics */}
          <div>
            <h2 className="text-lg font-bold border-b border-border pb-2 mb-4 print:text-black print:border-gray-300 flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" /> Computed Baseline
            </h2>
            <div className="bg-muted/30 rounded-lg p-4 border border-white/5 print:bg-gray-50 print:border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border/50 print:border-gray-200">
                    <td className="py-2 text-muted-foreground print:text-gray-600">Heart Rate Variability</td>
                    <td className="py-2 font-mono font-medium text-right">{report.baseline?.avgHrv.toFixed(1)} ± {report.baseline?.stdHrv.toFixed(1)} ms</td>
                  </tr>
                  <tr className="border-b border-border/50 print:border-gray-200">
                    <td className="py-2 text-muted-foreground print:text-gray-600">Resting Heart Rate</td>
                    <td className="py-2 font-mono font-medium text-right">{report.baseline?.avgRestingHr.toFixed(1)} ± {report.baseline?.stdRestingHr.toFixed(1)} bpm</td>
                  </tr>
                  <tr className="border-b border-border/50 print:border-gray-200">
                    <td className="py-2 text-muted-foreground print:text-gray-600">Blood Oxygen (SpO2)</td>
                    <td className="py-2 font-mono font-medium text-right">{report.baseline?.avgSpo2.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted-foreground print:text-gray-600">Sample Count</td>
                    <td className="py-2 font-mono font-medium text-right">{report.baseline?.dataPointCount} readings</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Trends */}
          <div>
            <h2 className="text-lg font-bold border-b border-border pb-2 mb-4 print:text-black print:border-gray-300 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-muted-foreground" /> Trend Analysis
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-white/5 print:bg-white print:border-gray-200">
                <span className="text-sm font-medium">HRV Trend</span>
                <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded", report.recentTrends.hrvTrend === 'declining' ? 'bg-destructive/10 text-destructive print:text-red-700' : 'bg-success/10 text-success print:text-green-700')}>
                  {report.recentTrends.hrvTrend}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-white/5 print:bg-white print:border-gray-200">
                <span className="text-sm font-medium">RHR Trend</span>
                <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded", report.recentTrends.hrTrend === 'declining' ? 'bg-destructive/10 text-destructive print:text-red-700' : 'bg-success/10 text-success print:text-green-700')}>
                  {report.recentTrends.hrTrend}
                </span>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg print:bg-blue-50 print:border-blue-200">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1 print:text-blue-800">AI Assessment</h3>
                <p className="text-sm font-medium text-foreground print:text-black">{report.recentTrends.overallAssessment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="mb-8">
          <h2 className="text-lg font-bold border-b border-border pb-2 mb-4 print:text-black print:border-gray-300">Algorithmic Clinical Notes</h2>
          <div className="p-5 bg-card border border-white/10 rounded-lg shadow-sm text-sm leading-relaxed text-muted-foreground print:bg-white print:border-gray-300 print:text-black">
            {report.clinicalNotes}
          </div>
        </div>

        {/* Active Alerts */}
        <div>
          <h2 className="text-lg font-bold border-b border-border pb-2 mb-4 print:text-black print:border-gray-300">Significant Deviations (Active)</h2>
          {report.activeAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic print:text-gray-500">No active anomalies detected in the current period.</p>
          ) : (
            <div className="space-y-3">
              {report.activeAlerts.map(alert => (
                <div key={alert.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-white/10 rounded-lg bg-muted/20 print:border-gray-300 print:bg-white">
                  <div className="flex-none">
                    <span className={cn("px-2 py-1 text-[10px] uppercase font-bold rounded-md border", getSeverityColor(alert.severity))}>
                      {alert.severity} Severity
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground print:text-black">{alert.title}</h4>
                      <AnomalyBadge type={alert.alertType} />
                    </div>
                    <p className="text-sm text-muted-foreground print:text-gray-700">{alert.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2 print:text-gray-500">Detected: {format(new Date(alert.detectedAt), "MMM d, yyyy HH:mm")} • Deviation: {alert.deviationPercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <footer className="mt-16 pt-8 border-t border-border text-center text-xs text-muted-foreground print:text-gray-400">
          <p>This report is generated automatically by Vitals-Overwatch AI analysis of wearable biometric data.</p>
          <p>It is intended to augment, not replace, professional medical diagnosis.</p>
        </footer>
      </div>
    </div>
  );
}
