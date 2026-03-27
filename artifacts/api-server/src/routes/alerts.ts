import { Router, type IRouter } from "express";
import { db, healthAlertsTable, familyMembersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { memberId, resolved } = req.query;

  let conditions = [];
  if (memberId) conditions.push(eq(healthAlertsTable.memberId, parseInt(String(memberId))));
  if (resolved !== undefined) conditions.push(eq(healthAlertsTable.resolved, resolved === "true"));

  const alerts = await db
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(healthAlertsTable.detectedAt));

  res.json(alerts);
});

router.post("/:alertId/resolve", async (req, res) => {
  const alertId = parseInt(req.params.alertId);
  const [updated] = await db
    .update(healthAlertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(healthAlertsTable.id, alertId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Alert not found" }); return; }

  const [memberRow] = await db
    .select({ name: familyMembersTable.name })
    .from(familyMembersTable)
    .where(eq(familyMembersTable.id, updated.memberId));

  res.json({ ...updated, memberName: memberRow?.name ?? "Unknown" });
});

export default router;
