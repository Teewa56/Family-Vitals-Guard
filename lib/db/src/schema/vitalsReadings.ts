import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { familyMembersTable } from "./familyMembers";

export const vitalsReadingsTable = pgTable("vitals_readings", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => familyMembersTable.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  heartRateVariability: real("heart_rate_variability").notNull(),
  restingHeartRate: real("resting_heart_rate").notNull(),
  spo2: real("spo2").notNull(),
  sleepScore: real("sleep_score"),
  recoveryScore: real("recovery_score"),
  bodyTemperature: real("body_temperature"),
  respiratoryRate: real("respiratory_rate"),
  anomalyScore: real("anomaly_score"),
  anomalyFlags: text("anomaly_flags").notNull().default("[]"),
});

export const insertVitalsReadingSchema = createInsertSchema(vitalsReadingsTable).omit({ id: true });
export type InsertVitalsReading = z.infer<typeof insertVitalsReadingSchema>;
export type VitalsReading = typeof vitalsReadingsTable.$inferSelect;
