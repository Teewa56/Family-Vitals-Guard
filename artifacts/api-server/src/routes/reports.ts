import { Router, type IRouter } from "express";
import { db, familyMembersTable, vitalsReadingsTable, healthAlertsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:memberId", async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const days = parseInt(String(req.query.days ?? "30"));

  const [member] = await db.select().from(familyMembersTable).where(eq(familyMembersTable.id, memberId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const vitalsHistory = await db
    .select()
    .from(vitalsReadingsTable)
    .where(and(
      eq(vitalsReadingsTable.memberId, memberId),
      gte(vitalsReadingsTable.timestamp, cutoff)
    ))
    .orderBy(desc(vitalsReadingsTable.timestamp));

  const activeAlerts = await db
    .select({
      id: healthAlertsTable.id,
      memberId: healthAlertsTable.memberId,
      memberName: familyMembersTable.name,
      severity: healthAlertsTable.severity,
      alertType: healthAlertsTable.alertType,
      title: healthAlertsTable.title,
      description: healthAlertsTable.description,
      deviationPercent: healthAlertsTable.deviationPercent,
      detectedAt: healthAlertsTable.detectedAt,
      resolved: healthAlertsTable.resolved,
      resolvedAt: healthAlertsTable.resolvedAt,
    })
    .from(healthAlertsTable)
    .innerJoin(familyMembersTable, eq(healthAlertsTable.memberId, familyMembersTable.id))
    .where(eq(healthAlertsTable.memberId, memberId))
    .orderBy(desc(healthAlertsTable.detectedAt));

  let baseline = null;
  if (vitalsHistory.length > 0) {
    const avgHrv = vitalsHistory.reduce((s, r) => s + r.heartRateVariability, 0) / vitalsHistory.length;
    const avgRhr = vitalsHistory.reduce((s, r) => s + r.restingHeartRate, 0) / vitalsHistory.length;
    const avgSpo2 = vitalsHistory.reduce((s, r) => s + r.spo2, 0) / vitalsHistory.length;
    const sleepVals = vitalsHistory.filter(r => r.sleepScore != null);
    const avgSleep = sleepVals.length > 0 ? sleepVals.reduce((s, r) => s + (r.sleepScore ?? 0), 0) / sleepVals.length : null;
    const stdHrv = Math.sqrt(vitalsHistory.reduce((s, r) => s + Math.pow(r.heartRateVariability - avgHrv, 2), 0) / vitalsHistory.length);
    const stdRhr = Math.sqrt(vitalsHistory.reduce((s, r) => s + Math.pow(r.restingHeartRate - avgRhr, 2), 0) / vitalsHistory.length);
    const stdSpo2 = Math.sqrt(vitalsHistory.reduce((s, r) => s + Math.pow(r.spo2 - avgSpo2, 2), 0) / vitalsHistory.length);

    baseline = {
      memberId,
      computedAt: new Date().toISOString(),
      avgHrv: Math.round(avgHrv * 10) / 10,
      stdHrv: Math.round(stdHrv * 10) / 10,
      avgRestingHr: Math.round(avgRhr * 10) / 10,
      stdRestingHr: Math.round(stdRhr * 10) / 10,
      avgSpo2: Math.round(avgSpo2 * 10) / 10,
      stdSpo2: Math.round(stdSpo2 * 10) / 10,
      avgSleepScore: avgSleep != null ? Math.round(avgSleep * 10) / 10 : null,
      dataPointCount: vitalsHistory.length,
      baselineDays: days,
    };
  }

  let hrvTrend = "Stable within normal range";
  let hrTrend = "Stable within normal range";
  let spo2Trend = "Consistently within healthy range";
  let overallAssessment = "No significant deviations detected. Continue monitoring.";

  if (vitalsHistory.length >= 6) {
    const half = Math.floor(vitalsHistory.length / 2);
    const recent = vitalsHistory.slice(0, half);
    const older = vitalsHistory.slice(half);
    const recentAvgHrv = recent.reduce((s, r) => s + r.heartRateVariability, 0) / recent.length;
    const olderAvgHrv = older.reduce((s, r) => s + r.heartRateVariability, 0) / older.length;
    const recentAvgHr = recent.reduce((s, r) => s + r.restingHeartRate, 0) / recent.length;
    const olderAvgHr = older.reduce((s, r) => s + r.restingHeartRate, 0) / older.length;
    const recentAvgSpo2 = recent.reduce((s, r) => s + r.spo2, 0) / recent.length;

    if (recentAvgHrv - olderAvgHrv > 5) hrvTrend = "Improving trend over the period";
    else if (olderAvgHrv - recentAvgHrv > 5) hrvTrend = "Declining trend — HRV decreasing";
    if (olderAvgHr - recentAvgHr > 3) hrTrend = "Heart rate normalizing — positive indicator";
    else if (recentAvgHr - olderAvgHr > 3) hrTrend = "Resting HR trending upward — monitor closely";
    if (recentAvgSpo2 < 96) spo2Trend = "SpO2 readings below optimal — physician review recommended";
  }

  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical" || a.severity === "high");
  if (criticalAlerts.length > 0) {
    overallAssessment = `${criticalAlerts.length} high-priority anomaly event(s) detected during this period. Longitudinal biometric analysis suggests physiological stress patterns that may warrant clinical evaluation. A review of the anomaly timeline is recommended.`;
  } else if (activeAlerts.length > 0) {
    overallAssessment = `${activeAlerts.length} minor anomaly event(s) noted during this period. No critical deviations detected. Continue regular monitoring schedule.`;
  }

  res.json({
    memberId: member.id,
    memberName: member.name,
    memberAge: member.age,
    reportGeneratedAt: new Date().toISOString(),
    reportPeriodDays: days,
    wearableSource: member.wearableSource,
    baseline,
    recentTrends: { hrvTrend, hrTrend, spo2Trend, overallAssessment },
    activeAlerts,
    vitalsHistory: vitalsHistory.map(r => ({ ...r, anomalyFlags: JSON.parse(r.anomalyFlags || "[]") })),
    clinicalNotes: `Data collected from ${member.wearableSource.replace(/_/g, " ")} wearable device. This report presents ${days}-day longitudinal biometric data for ${member.name} (age ${member.age}). All values represent device-captured measurements and should be interpreted in the context of clinical examination.`,
  });
});

export default router;
