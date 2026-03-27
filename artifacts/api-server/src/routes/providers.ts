import { Router, type IRouter } from "express";
import { db, deviceConnectionsTable, vitalsReadingsTable, familyMembersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

const PROVIDER_CATALOG = [
  {
    id: "apple_watch",
    name: "Apple Watch",
    description: "Sync HRV, heart rate, SpO2, sleep, and activity data from Apple HealthKit.",
    icon: "🍎",
    category: "smartwatch",
    features: ["HRV", "Resting HR", "SpO2", "Sleep Score", "ECG", "Blood Oxygen"],
  },
  {
    id: "oura",
    name: "Oura Ring",
    description: "Import Readiness, Sleep, and Activity scores from your Oura Ring Gen 3/4.",
    icon: "💍",
    category: "ring",
    features: ["HRV", "Resting HR", "SpO2", "Sleep Score", "Readiness Score", "Body Temperature"],
  },
  {
    id: "whoop",
    name: "Whoop Strap",
    description: "Pull Recovery, Strain, and Sleep data from your WHOOP 4.0 or 5.0.",
    icon: "⚡",
    category: "strap",
    features: ["HRV", "Resting HR", "Respiratory Rate", "Recovery Score", "Sleep Consistency"],
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Integrate with Garmin Connect for health and performance metrics.",
    icon: "🏃",
    category: "smartwatch",
    features: ["HRV", "Resting HR", "SpO2", "Sleep Score", "Body Battery", "Stress Score"],
  },
  {
    id: "fitbit",
    name: "Fitbit / Google Fit",
    description: "Connect Fitbit and Google Health for heart rate and sleep tracking.",
    icon: "📊",
    category: "platform",
    features: ["Resting HR", "Sleep Score", "SpO2", "Active Zone Minutes"],
  },
  {
    id: "manual",
    name: "Manual Entry",
    description: "Enter biometric readings directly for any non-connected device.",
    icon: "✏️",
    category: "manual",
    features: ["HRV", "Resting HR", "SpO2", "Body Temperature", "Sleep Score"],
  },
];

function gaussianRandom(mean: number, std: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

async function generateSyncedReadings(memberId: number, count: number) {
  const [member] = await db.select().from(familyMembersTable).where(eq(familyMembersTable.id, memberId));
  if (!member) return 0;

  const baseHrv = member.isHighRisk ? 30 : member.age > 50 ? 40 : 55;
  const baseHr = member.isHighRisk ? 76 : member.age > 50 ? 70 : 64;
  const baseSpo2 = member.isHighRisk ? 96.5 : 98.0;

  const readings = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i * 4);
    readings.push({
      memberId,
      timestamp: date,
      heartRateVariability: Math.max(10, Math.round(gaussianRandom(baseHrv, 7) * 10) / 10),
      restingHeartRate: Math.max(40, Math.round(gaussianRandom(baseHr, 4) * 10) / 10),
      spo2: Math.min(100, Math.max(90, Math.round(gaussianRandom(baseSpo2, 0.5) * 10) / 10)),
      sleepScore: Math.round(gaussianRandom(75, 10) * 10) / 10,
      recoveryScore: Math.round(gaussianRandom(72, 12) * 10) / 10,
      bodyTemperature: Math.round(gaussianRandom(36.6, 0.2) * 100) / 100,
      respiratoryRate: Math.round(gaussianRandom(14, 1.5) * 10) / 10,
      anomalyScore: 0,
      anomalyFlags: "[]",
    });
  }
  await db.insert(vitalsReadingsTable).values(readings);
  return readings.length;
}

router.get("/", async (req, res) => {
  const connections = await db.select().from(deviceConnectionsTable);
  const [readingCounts] = await db.select({ cnt: count() }).from(vitalsReadingsTable);

  const providers = PROVIDER_CATALOG.map((p) => {
    const conn = connections.find((c) => c.provider === p.id);
    return {
      ...p,
      connected: conn?.connected ?? false,
      lastSyncAt: conn?.lastSyncAt?.toISOString() ?? null,
      syncedReadings: conn?.connected ? Math.floor(Number(readingCounts?.cnt ?? 0) / Math.max(connections.filter(c => c.connected).length, 1)) : 0,
      status: conn?.connected ? "connected" : "disconnected",
    };
  });
  res.json(providers);
});

router.post("/:provider/connect", async (req, res) => {
  const { provider } = req.params;
  const { memberId } = req.body;
  const catalog = PROVIDER_CATALOG.find(p => p.id === provider);
  if (!catalog) { res.status(404).json({ error: "Provider not found" }); return; }

  const [existing] = await db.select().from(deviceConnectionsTable).where(eq(deviceConnectionsTable.provider, provider));
  if (existing) {
    await db.update(deviceConnectionsTable).set({
      connected: true,
      lastSyncAt: new Date(),
    }).where(eq(deviceConnectionsTable.id, existing.id));
  } else {
    await db.insert(deviceConnectionsTable).values({
      userId: "demo-user",
      provider,
      providerUserId: `${provider}-${Date.now()}`,
      connected: true,
      lastSyncAt: new Date(),
    });
  }

  if (memberId) {
    await generateSyncedReadings(memberId, 6);
    await db.update(familyMembersTable).set({ wearableSource: provider as any }).where(eq(familyMembersTable.id, memberId));
  }

  res.json({
    ...catalog,
    connected: true,
    lastSyncAt: new Date().toISOString(),
    syncedReadings: memberId ? 6 : 0,
    status: "connected",
  });
});

router.post("/:provider/disconnect", async (req, res) => {
  const { provider } = req.params;
  const catalog = PROVIDER_CATALOG.find(p => p.id === provider);
  if (!catalog) { res.status(404).json({ error: "Provider not found" }); return; }

  await db.update(deviceConnectionsTable).set({ connected: false }).where(eq(deviceConnectionsTable.provider, provider));

  res.json({ ...catalog, connected: false, lastSyncAt: null, syncedReadings: 0, status: "disconnected" });
});

router.post("/:provider/sync", async (req, res) => {
  const { provider } = req.params;
  const { memberId } = req.body;
  const [conn] = await db.select().from(deviceConnectionsTable).where(eq(deviceConnectionsTable.provider, provider));
  if (!conn?.connected) { res.status(400).json({ error: "Provider not connected" }); return; }

  const imported = memberId ? await generateSyncedReadings(memberId, 3) : 0;
  await db.update(deviceConnectionsTable).set({ lastSyncAt: new Date() }).where(eq(deviceConnectionsTable.provider, provider));

  res.json({
    provider,
    readingsImported: imported,
    lastSyncAt: new Date().toISOString(),
    message: `Successfully synced ${imported} new readings from ${provider.replace(/_/g, " ")}`,
  });
});

export default router;
