import { Router, type IRouter } from "express";
import { db, familyMembersTable, vitalsReadingsTable, healthAlertsTable } from "@workspace/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

function determineStatus(anomalyScore: number | null, alertCount: number, hrv: number, spo2: number): string {
  const score = anomalyScore ?? 0;
  if (score > 0.7 || alertCount > 2) return "critical";
  if (score > 0.45 || alertCount > 0) return "warning";
  if (score > 0.2) return "fair";
  if (hrv > 50 && spo2 > 97) return "excellent";
  return "good";
}

router.get("/overview", async (req, res) => {
  const members = await db.select().from(familyMembersTable).orderBy(familyMembersTable.id);

  const familyCards = await Promise.all(members.map(async (member) => {
    const [latestReading] = await db
      .select()
      .from(vitalsReadingsTable)
      .where(eq(vitalsReadingsTable.memberId, member.id))
      .orderBy(desc(vitalsReadingsTable.timestamp))
      .limit(1);

    const activeAlerts = await db
      .select()
      .from(healthAlertsTable)
      .where(and(
        eq(healthAlertsTable.memberId, member.id),
        eq(healthAlertsTable.resolved, false)
      ));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReadings = await db
      .select()
      .from(vitalsReadingsTable)
      .where(and(
        eq(vitalsReadingsTable.memberId, member.id),
        gte(vitalsReadingsTable.timestamp, sevenDaysAgo)
      ))
      .orderBy(vitalsReadingsTable.timestamp);

    let trendHrv: "improving" | "stable" | "declining" = "stable";
    let trendHr: "improving" | "stable" | "declining" = "stable";

    if (recentReadings.length >= 3) {
      const half = Math.floor(recentReadings.length / 2);
      const first = recentReadings.slice(0, half);
      const second = recentReadings.slice(half);
      const avgHrvFirst = first.reduce((s, r) => s + r.heartRateVariability, 0) / first.length;
      const avgHrvSecond = second.reduce((s, r) => s + r.heartRateVariability, 0) / second.length;
      const avgHrFirst = first.reduce((s, r) => s + r.restingHeartRate, 0) / first.length;
      const avgHrSecond = second.reduce((s, r) => s + r.restingHeartRate, 0) / second.length;
      trendHrv = avgHrvSecond - avgHrvFirst > 3 ? "improving" : avgHrvFirst - avgHrvSecond > 3 ? "declining" : "stable";
      trendHr = avgHrFirst - avgHrSecond > 3 ? "improving" : avgHrSecond - avgHrFirst > 3 ? "declining" : "stable";
    }

    const status = latestReading
      ? determineStatus(latestReading.anomalyScore, activeAlerts.length, latestReading.heartRateVariability, latestReading.spo2)
      : "fair";

    return {
      member,
      summary: {
        memberId: member.id,
        latestReading: latestReading ? { ...latestReading, anomalyFlags: JSON.parse(latestReading.anomalyFlags || "[]") } : null,
        status,
        trendHrv,
        trendHr,
        activeAlerts: activeAlerts.length,
      },
      latestReading: latestReading ? { ...latestReading, anomalyFlags: JSON.parse(latestReading.anomalyFlags || "[]") } : null,
      activeAlertCount: activeAlerts.length,
    };
  }));

  const recentAlerts = await db
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
    .orderBy(desc(healthAlertsTable.detectedAt))
    .limit(10);

  const membersWithAlerts = familyCards.filter(c => c.activeAlertCount > 0).length;
  const criticalAlerts = recentAlerts.filter(a => a.severity === "critical" && !a.resolved).length;

  res.json({
    totalMembers: members.length,
    membersWithAlerts,
    criticalAlerts,
    familyCards,
    recentAlerts,
  });
});

export default router;
