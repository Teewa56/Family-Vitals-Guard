import { pgTable, varchar, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userProfilesTable = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  defaultFamilyMemberId: integer("default_family_member_id"),
  timezone: text("timezone").notNull().default("UTC"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  guardianAlertEmail: text("guardian_alert_email"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
