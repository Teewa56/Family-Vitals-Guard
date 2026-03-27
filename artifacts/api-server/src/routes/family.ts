import { Router, type IRouter } from "express";
import { db, familyMembersTable, vitalsReadingsTable, healthAlertsTable } from "@workspace/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function computeAnomaly(reading: {
  heartRateVariability: number;
  restingHeartRate: number;
  spo2: number;
}, baseline: {
  avgHrv: number;
  stdHrv: number;
  avgRestingHr: number;
  stdRestingHr: number;
  avgSpo2: number;
  stdSpo2: number;
} | null): { score: number; flags: string[] } {
  if (!baseline) return { score: 0, flags: [] };

  const flags: string[] = [];
  let score = 0;

  const zHrv = baseline.stdHrv > 0 ? (reading.heartRateVariability - baseline.avgHrv) / baseline.stdHrv : 0;
  const zHr = baseline.stdRestingHr > 0 ? (reading.restingHeartRate - baseline.avgRestingHr) / baseline.stdRestingHr : 0;
  const zSpo2 = baseline.stdSpo2 > 0 ? (reading.spo2 - baseline.avgSpo2) / baseline.stdSpo2 : 0;

  if (zHrv < -1.5) { flags.push("hrv_drop"); score += 0.35; }
  if (zHr > 1.5) { flags.push("elevated_hr"); score += 0.35; }
  if (zSpo2 < -1.5) { flags.push("low_spo2"); score += 0.40; }
  if (zHrv < -1.5 && zHr > 1.5) { flags.push("combined_stress"); score = Math.min(score + 0.15, 1); }

  return { score: Math.min(score, 1), flags };
}

async function getBaseline(memberId: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const readings = await db
    .select()
    .from(vitalsReadingsTable)
    .where(and(
      eq(vitalsReadingsTable.memberId, memberId),
      gte(vitalsReadingsTable.timestamp, thirtyDaysAgo)
    ))
    .orderBy(desc(vitalsReadingsTable.timestamp));

  if (readings.length === 0) return null;

  const avgHrv = readings.reduce((s, r) => s + r.heartRateVariability, 0) / readings.length;
  const avgRestingHr = readings.reduce((s, r) => s + r.restingHeartRate, 0) / readings.length;
  const avgSpo2 = readings.reduce((s, r) => s + r.spo2, 0) / readings.length;
  const avgSleep = readings.filter(r => r.sleepScore != null).reduce((s, r) => s + (r.sleepScore ?? 0), 0) / readings.filter(r => r.sleepScore != null).length || null;

  const stdHrv = Math.sqrt(readings.reduce((s, r) => s + Math.pow(r.heartRateVariability - avgHrv, 2), 0) / readings.length);
  const stdRestingHr = Math.sqrt(readings.reduce((s, r) => s + Math.pow(r.restingHeartRate - avgRestingHr, 2), 0) / readings.length);
  const stdSpo2 = Math.sqrt(readings.reduce((s, r) => s + Math.pow(r.spo2 - avgSpo2, 2), 0) / readings.length);

  return {
    memberId,
    computedAt: new Date().toISOString(),
    avgHrv: Math.round(avgHrv * 10) / 10,
    stdHrv: Math.round(stdHrv * 10) / 10,
    avgRestingHr: Math.round(avgRestingHr * 10) / 10,
    stdRestingHr: Math.round(stdRestingHr * 10) / 10,
    avgSpo2: Math.round(avgSpo2 * 10) / 10,
    stdSpo2: Math.round(stdSpo2 * 10) / 10,
    avgSleepScore: avgSleep != null ? Math.round(avgSleep * 10) / 10 : null,
    dataPointCount: readings.length,
    baselineDays: 30,
  };
}

function determineStatus(reading: { heartRateVariability: number; restingHeartRate: number; spo2: number; anomalyScore: number | null } | null, alertCount: number): string {
  if (!reading) return "fair";
  const score = reading.anomalyScore ?? 0;
  if (score > 0.7 || alertCount > 2) return "critical";
  if (score > 0.45 || alertCount > 0) return "warning";
  if (score > 0.2) return "fair";
  if (reading.heartRateVariability > 50 && reading.spo2 > 97) return "excellent";
  return "good";
}

router.get("/members", async (req, res) => {
  const members = await db.select().from(familyMembersTable).orderBy(familyMembersTable.id);
  res.json(members);
});

router.post("/members", async (req, res) => {
  const { name, age, relationship, wearableSource, isHighRisk, guardianViewEnabled } = req.body;
  const avatarInitials = getInitials(name);
  const [member] = await db.insert(familyMembersTable).values({
    name, age, relationship, avatarInitials, wearableSource: wearableSource ?? "manual",
    isHighRisk: isHighRisk ?? false,
    guardianViewEnabled: guardianViewEnabled ?? false,
  }).returning();
  res.status(201).json(member);
});

router.get("/members/:memberId", async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const [member] = await db.select().from(familyMembersTable).where(eq(familyMembersTable.id, memberId));
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member);
});

router.get("/members/:memberId/vitals", async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const days = parseInt(String(req.query.days ?? "7"));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const readings = await db
    .select()
    .from(vitalsReadingsTable)
    .where(and(
      eq(vitalsReadingsTable.memberId, memberId),
      gte(vitalsReadingsTable.timestamp, cutoff)
    ))
    .orderBy(desc(vitalsReadingsTable.timestamp));

  const result = readings.map(r => ({
    ...r,
    anomalyFlags: JSON.parse(r.anomalyFlags || "[]"),
  }));
  res.json(result);
});

router.post("/members/:memberId/vitals", async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const { heartRateVariability, restingHeartRate, spo2, sleepScore, recoveryScore, bodyTemperature, respiratoryRate, timestamp } = req.body;

  const baseline = await getBaseline(memberId);
  const { score, flags } = computeAnomaly({ heartRateVariability, restingHeartRate, spo2 }, baseline);

  const [reading] = await db.insert(vitalsReadingsTable).values({
    memberId,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    heartRateVariability,
    restingHeartRate,
    spo2,
    sleepScore: sleepScore ?? null,
    recoveryScore: recoveryScore ?? null,
    bodyTemperature: bodyTemperature ?? null,
    respiratoryRate: respiratoryRate ?? null,
    anomalyScore: score,
    anomalyFlags: JSON.stringify(flags),
  }).returning();

  if (score > 0.4 && flags.length > 0) {
    const [member] = await db.select().from(familyMembersTable).where(eq(familyMembersTable.id, memberId));
    const severity = score > 0.7 ? "critical" : score > 0.5 ? "high" : "medium";
    const alertTypeMap: Record<string, string> = {
      combined_stress: "Combined Stress Pattern Detected",
      hrv_drop: "HRV Significantly Below Baseline",
      elevated_hr: "Resting Heart Rate Elevated",
      low_spo2: "Blood Oxygen Below Threshold",
    };
    const primaryFlag = flags.includes("combined_stress") ? "combined_stress" : flags[0];
    await db.insert(healthAlertsTable).values({
      memberId,
      severity,
      alertType: primaryFlag,
      title: alertTypeMap[primaryFlag] ?? "Anomaly Detected",
      description: `${member?.name ?? "Member"}'s vitals deviated from their personal baseline. Flags: ${flags.join(", ")}.`,
      deviationPercent: Math.round(score * 100),
    });
  }

  res.status(201).json({ ...reading, anomalyFlags: flags });
});

router.get("/members/:memberId/baseline", async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const baseline = await getBaseline(memberId);
  if (!baseline) { res.status(404).json({ error: "Not enough data to compute baseline" }); return; }
  res.json(baseline);
});

router.get("/members/:memberId/summary", async (req, res) => {
  const memberId = parseInt(req.params.memberId);

  const [latestReading] = await db
    .select()
    .from(vitalsReadingsTable)
    .where(eq(vitalsReadingsTable.memberId, memberId))
    .orderBy(desc(vitalsReadingsTable.timestamp))
    .limit(1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentReadings = await db
    .select()
    .from(vitalsReadingsTable)
    .where(and(
      eq(vitalsReadingsTable.memberId, memberId),
      gte(vitalsReadingsTable.timestamp, sevenDaysAgo)
    ))
    .orderBy(vitalsReadingsTable.timestamp);

  const baseline = await getBaseline(memberId);
  const activeAlerts = await db
    .select()
    .from(healthAlertsTable)
    .where(and(
      eq(healthAlertsTable.memberId, memberId),
      eq(healthAlertsTable.resolved, false)
    ));

  let trendHrv: "improving" | "stable" | "declining" = "stable";
  let trendHr: "improving" | "stable" | "declining" = "stable";

  if (recentReadings.length >= 3) {
    const half = Math.floor(recentReadings.length / 2);
    const firstHalf = recentReadings.slice(0, half);
    const secondHalf = recentReadings.slice(half);
    const avgHrvFirst = firstHalf.reduce((s, r) => s + r.heartRateVariability, 0) / firstHalf.length;
    const avgHrvSecond = secondHalf.reduce((s, r) => s + r.heartRateVariability, 0) / secondHalf.length;
    const avgHrFirst = firstHalf.reduce((s, r) => s + r.restingHeartRate, 0) / firstHalf.length;
    const avgHrSecond = secondHalf.reduce((s, r) => s + r.restingHeartRate, 0) / secondHalf.length;
    const threshold = 3;
    trendHrv = avgHrvSecond - avgHrvFirst > threshold ? "improving" : avgHrvFirst - avgHrvSecond > threshold ? "declining" : "stable";
    trendHr = avgHrFirst - avgHrSecond > threshold ? "improving" : avgHrSecond - avgHrFirst > threshold ? "declining" : "stable";
  }

  const latestForStatus = latestReading ? { ...latestReading, anomalyScore: latestReading.anomalyScore } : null;
  const status = determineStatus(latestForStatus, activeAlerts.length);

  res.json({
    memberId,
    latestReading: latestReading ? { ...latestReading, anomalyFlags: JSON.parse(latestReading.anomalyFlags || "[]") } : null,
    baseline,
    status,
    trendHrv,
    trendHr,
    activeAlerts: activeAlerts.length,
  });
});

export default router;
