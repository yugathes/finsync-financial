import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
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
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;
