import { pgTable, serial, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const deviceConnectionsTable = pgTable("device_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  connected: boolean("connected").notNull().default(false),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DeviceConnection = typeof deviceConnectionsTable.$inferSelect;
