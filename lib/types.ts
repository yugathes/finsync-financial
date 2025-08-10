// This file exports types for the application based on the Prisma schema
// Since we can't generate Prisma client due to network restrictions, we define types manually

export type User = {
  id: string;
  email: string;
  password?: string | null;
  monthlyIncome?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MonthlyIncome = {
  id: string;
  userId: string;
  month: string;
  amount: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Commitment = {
  id: string;
  userId: string;
  type: string;
  title: string;
  category: string;
  amount: string;
  recurring: boolean;
  shared: boolean;
  groupId?: string | null;
  startDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommitmentPayment = {
  id: string;
  commitmentId: string;
  month: string;
  paidBy: string;
  amountPaid: string;
  paidAt: Date;
  createdAt: Date;
};

// Insert types (for creating new records) - simplified for controller compatibility
export type InsertUser = {
  id?: string;
  email: string;
  password?: string;
  monthlyIncome?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InsertMonthlyIncome = {
  month: string;
  amount: string;
};

export type InsertCommitment = {
  type: string;
  title: string;
  category: string;
  amount: string;
  recurring?: boolean;
  shared?: boolean;
  groupId?: string;
  startDate?: Date | string;
};

export type InsertCommitmentPayment = {
  commitmentId: string;
  month: string;
  amountPaid: string;
};

// Update types (for updating existing records)
export type UpdateUser = Partial<User>;
export type UpdateMonthlyIncome = Partial<MonthlyIncome>;
export type UpdateCommitment = Partial<Commitment>;
export type UpdateCommitmentPayment = Partial<CommitmentPayment>;

// Extended types with relations
export type UserWithIncome = User & {
  monthlyIncomes: MonthlyIncome[];
};

export type UserWithCommitments = User & {
  commitments: Commitment[];
};

export type CommitmentWithPayments = Commitment & {
  payments: CommitmentPayment[];
};

export type CommitmentWithUser = Commitment & {
  user: User;
};