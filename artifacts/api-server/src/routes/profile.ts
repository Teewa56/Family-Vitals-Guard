import { Router, type IRouter } from "express";
import { db, usersTable, userProfilesTable, familyMembersTable, vitalsReadingsTable, healthAlertsTable, deviceConnectionsTable } from "@workspace/db";
import { eq, count, desc, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = req.user;
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id));
  res.json({
    userId: user.id,
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    defaultFamilyMemberId: profile?.defaultFamilyMemberId ?? null,
    timezone: profile?.timezone ?? "UTC",
    notificationsEnabled: profile?.notificationsEnabled ?? true,
    guardianAlertEmail: profile?.guardianAlertEmail ?? null,
    onboardingComplete: profile?.onboardingComplete ?? false,
  });
});

router.patch("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = req.user;
  const { defaultFamilyMemberId, timezone, notificationsEnabled, guardianAlertEmail } = req.body;
  const [existing] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id));
  if (existing) {
    await db.update(userProfilesTable).set({
      ...(defaultFamilyMemberId !== undefined ? { defaultFamilyMemberId } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(notificationsEnabled !== undefined ? { notificationsEnabled } : {}),
      ...(guardianAlertEmail !== undefined ? { guardianAlertEmail } : {}),
    }).where(eq(userProfilesTable.userId, user.id));
  } else {
    await db.insert(userProfilesTable).values({
      userId: user.id,
      defaultFamilyMemberId: defaultFamilyMemberId ?? null,
      timezone: timezone ?? "UTC",
      notificationsEnabled: notificationsEnabled ?? true,
      guardianAlertEmail: guardianAlertEmail ?? null,
    });
  }
  const [updated] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id));
  res.json({
    userId: user.id,
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    defaultFamilyMemberId: updated?.defaultFamilyMemberId ?? null,
    timezone: updated?.timezone ?? "UTC",
    notificationsEnabled: updated?.notificationsEnabled ?? true,
    guardianAlertEmail: updated?.guardianAlertEmail ?? null,
    onboardingComplete: updated?.onboardingComplete ?? false,
  });
});

router.get("/stats", async (_req, res) => {
  const members = await db.select().from(familyMembersTable);
  const [readingRow] = await db.select({ cnt: count() }).from(vitalsReadingsTable);
  const [alertRow] = await db.select({ cnt: count() }).from(healthAlertsTable);
  const [resolvedRow] = await db.select({ cnt: count() }).from(healthAlertsTable).where(eq(healthAlertsTable.resolved, true));
  const [connectedRow] = await db.select({ cnt: count() }).from(deviceConnectionsTable).where(eq(deviceConnectionsTable.connected, true));

  const totalReadings = readingRow?.cnt ?? 0;
  const totalAlerts = alertRow?.cnt ?? 0;
  const resolvedAlerts = resolvedRow?.cnt ?? 0;
  const connectedProviders = connectedRow?.cnt ?? 0;
  const avgDailyReadings = members.length > 0 ? Math.round((Number(totalReadings) / 30) * 10) / 10 : 0;
  const daysTracked = 30;

  const memberProgress = await Promise.all(members.map(async (m) => {
    const [readCount] = await db.select({ cnt: count() }).from(vitalsReadingsTable).where(eq(vitalsReadingsTable.memberId, m.id));
    const [lastReading] = await db.select().from(vitalsReadingsTable).where(eq(vitalsReadingsTable.memberId, m.id)).orderBy(desc(vitalsReadingsTable.timestamp)).limit(1);
    const [alertCount] = await db.select({ cnt: count() }).from(healthAlertsTable).where(and(eq(healthAlertsTable.memberId, m.id), eq(healthAlertsTable.resolved, false)));
    const anomalyScore = lastReading?.anomalyScore ?? 0;
    const alerts = Number(alertCount?.cnt ?? 0);
    const status = anomalyScore > 0.7 || alerts > 2 ? "critical" : anomalyScore > 0.45 || alerts > 0 ? "warning" : "good";
    return {
      memberId: m.id,
      memberName: m.name,
      avatarInitials: m.avatarInitials,
      readingCount: Number(readCount?.cnt ?? 0),
      lastReadingAt: lastReading?.timestamp?.toISOString() ?? null,
      status,
      hrvTrend: "stable",
      alertCount: alerts,
    };
  }));

  res.json({
    totalReadings: Number(totalReadings),
    daysTracked,
    alertsGenerated: Number(totalAlerts),
    alertsResolved: Number(resolvedAlerts),
    familyMemberCount: members.length,
    connectedProviders: Number(connectedProviders),
    currentStreak: 14,
    avgDailyReadings,
    memberProgress,
  });
});

export default router;
