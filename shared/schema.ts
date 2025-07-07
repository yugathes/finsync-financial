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

// New comprehensive commitments table
export const newCommitments = pgTable("new_commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'static' | 'dynamic'
  title: text("title").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  recurring: boolean("recurring").default(true),
  shared: boolean("shared").default(false),
  groupId: uuid("group_id"),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payment tracking table
export const commitmentPayments = pgTable("commitment_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  commitmentId: uuid("commitment_id").references(() => newCommitments.id).notNull(),
  month: text("month").notNull(), // e.g., '2025-07'
  paidBy: integer("paid_by").references(() => users.id).notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").defaultNow()
});

// Legacy commitments table for backward compatibility
export const commitments = pgTable("commitments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'static' or 'dynamic'
  category: text("category").notNull(),
  isPaid: boolean("is_paid").default(false),
  isShared: boolean("is_shared").default(false),
  sharedWith: text("shared_with").array(), // Array of user IDs who share this commitment
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertNewCommitmentSchema = createInsertSchema(newCommitments).pick({
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

export const insertCommitmentSchema = createInsertSchema(commitments).pick({
  title: true,
  amount: true,
  type: true,
  category: true,
  isPaid: true,
  isShared: true,
  sharedWith: true,
  dueDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMonthlyIncome = z.infer<typeof insertMonthlyIncomeSchema>;
export type MonthlyIncome = typeof monthlyIncome.$inferSelect;
export type InsertNewCommitment = z.infer<typeof insertNewCommitmentSchema>;
export type NewCommitment = typeof newCommitments.$inferSelect;
export type InsertCommitmentPayment = z.infer<typeof insertCommitmentPaymentSchema>;
export type CommitmentPayment = typeof commitmentPayments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;
