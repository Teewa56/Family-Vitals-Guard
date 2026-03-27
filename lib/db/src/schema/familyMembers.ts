import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const familyMembersTable = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  relationship: text("relationship").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
  wearableSource: text("wearable_source").notNull().default("manual"),
  isHighRisk: boolean("is_high_risk").notNull().default(false),
  guardianViewEnabled: boolean("guardian_view_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembersTable).omit({ id: true, createdAt: true });
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembersTable.$inferSelect;
