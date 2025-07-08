import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  monthlyIncome: numeric("monthly_income", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly income tracking (new comprehensive approach)
export const monthlyIncome = pgTable("monthly_income", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).notNull(),
  month: text("month").notNull(), // e.g., '2025-07'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Updated commitments table matching the database structure
export const commitments = pgTable("commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'static' | 'dynamic'
  title: text("title").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  recurring: boolean("recurring").default(false),
  shared: boolean("shared").default(false),
  groupId: uuid("group_id"),
  startDate: date("start_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payment tracking table
export const commitmentPayments = pgTable("commitment_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  commitmentId: uuid("commitment_id").references(() => commitments.id).notNull(),
  month: text("month").notNull(), // e.g., '2025-07'
  paidBy: integer("paid_by").references(() => users.id).notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  monthlyIncome: true,
});

export const insertMonthlyIncomeSchema = createInsertSchema(monthlyIncome).pick({
  month: true,
  amount: true
});

export const insertCommitmentSchema = createInsertSchema(commitments).pick({
  type: true,
  title: true,
  category: true,
  amount: true,
  recurring: true,
  shared: true,
  groupId: true,
  startDate: true
});

export const insertCommitmentPaymentSchema = createInsertSchema(commitmentPayments).pick({
  commitmentId: true,
  month: true,
  amountPaid: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMonthlyIncome = z.infer<typeof insertMonthlyIncomeSchema>;
export type MonthlyIncome = typeof monthlyIncome.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitmentPayment = z.infer<typeof insertCommitmentPaymentSchema>;
export type CommitmentPayment = typeof commitmentPayments.$inferSelect;
