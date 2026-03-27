import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { familyMembersTable } from "./familyMembers";

export const healthAlertsTable = pgTable("health_alerts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => familyMembersTable.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(),
  alertType: text("alert_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deviationPercent: real("deviation_percent").notNull(),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
});

export const insertHealthAlertSchema = createInsertSchema(healthAlertsTable).omit({ id: true });
export type InsertHealthAlert = z.infer<typeof insertHealthAlertSchema>;
export type HealthAlert = typeof healthAlertsTable.$inferSelect;
