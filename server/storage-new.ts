import { eq, desc, and } from 'drizzle-orm';
import { supabase } from './db';
import { 
  users, 
  monthlyIncome,
  commitments,
  commitmentPayments,
  type User, 
  type InsertUser, 
  type MonthlyIncome,
  type InsertMonthlyIncome,
  type Commitment,
  type InsertCommitment,
  type CommitmentPayment,
  type InsertCommitmentPayment
} from "@shared/schema";

// Enhanced storage interface for comprehensive commitment management
export interface INewStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserIncome(userId: number, income: string): Promise<User>;
  
  // Monthly Income methods
  getMonthlyIncome(userId: number, month: string): Promise<MonthlyIncome | undefined>;
  setMonthlyIncome(userId: number, income: InsertMonthlyIncome): Promise<MonthlyIncome>;
  updateMonthlyIncome(userId: number, month: string, amount: string): Promise<MonthlyIncome>;
  
  // Commitment methods
  getCommitmentsByUser(userId: number): Promise<Commitment[]>;
  getCommitmentsForMonth(userId: number, month: string): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]>;
  createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment>;
  updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment>;
  deleteCommitment(id: string): Promise<void>;
  
  // Payment methods
  markCommitmentPaid(commitmentId: string, userId: number, month: string, amount: string): Promise<CommitmentPayment>;
  markCommitmentUnpaid(commitmentId: string, month: string): Promise<void>;
  getCommitmentPayments(userId: number, month: string): Promise<CommitmentPayment[]>;
}

export class NewDatabaseStorage implements INewStorage {
  // Helper function to get current month
  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(insertUser)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserIncome(userId: number, income: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ monthly_income: income, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user income:', error);
      throw error;
    }
  }

  // Monthly Income methods
  async getMonthlyIncome(userId: number, month: string): Promise<MonthlyIncome | undefined> {
    try {
      const { data, error } = await supabase
        .from('monthly_income')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error('Error fetching monthly income:', error);
      return undefined;
    }
  }

  async setMonthlyIncome(userId: number, income: InsertMonthlyIncome): Promise<MonthlyIncome> {
    try {
      const { data, error } = await supabase
        .from('monthly_income')
        .upsert({
          user_id: userId,
          ...income,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting monthly income:', error);
      throw error;
    }
  }

  async updateMonthlyIncome(userId: number, month: string, amount: string): Promise<MonthlyIncome> {
    try {
      const { data, error } = await supabase
        .from('monthly_income')
        .upsert({
          user_id: userId,
          month,
          amount,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating monthly income:', error);
      throw error;
    }
  }

  // Commitment methods
  async getCommitmentsByUser(userId: number): Promise<Commitment[]> {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching commitments:', error);
      return [];
    }
  }

  async getCommitmentsForMonth(userId: number, month: string): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]> {
    try {
      // Get all commitments for the user
      const { data: commitments, error: commitmentsError } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId);
      
      if (commitmentsError) throw commitmentsError;

      // Get all payments for this month
      const { data: payments, error: paymentsError } = await supabase
        .from('commitment_payments')
        .select('*')
        .eq('paid_by', userId)
        .eq('month', month);
      
      if (paymentsError) throw paymentsError;

      // Combine commitments with payment status
      const commitmentsWithPayments = (commitments || []).map(commitment => {
        const payment = payments?.find(p => p.commitment_id === commitment.id);
        return {
          ...commitment,
          isPaid: !!payment,
          amountPaid: payment?.amount_paid
        };
      });

      return commitmentsWithPayments;
    } catch (error) {
      console.error('Error fetching commitments for month:', error);
      return [];
    }
  }

  async createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment> {
    try {
      const { userId, ...commitmentData } = commitment;
      const { data, error } = await supabase
        .from('commitments')
        .insert({
          user_id: userId,
          ...commitmentData
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating commitment:', error);
      throw error;
    }
  }

  async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating commitment:', error);
      throw error;
    }
  }

  async deleteCommitment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('commitments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting commitment:', error);
      throw error;
    }
  }

  // Payment methods
  async markCommitmentPaid(commitmentId: string, userId: number, month: string, amount: string): Promise<CommitmentPayment> {
    try {
      const { data, error } = await supabase
        .from('commitment_payments')
        .upsert({
          commitment_id: commitmentId,
          paid_by: userId,
          month,
          amount_paid: amount
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking commitment as paid:', error);
      throw error;
    }
  }

  async markCommitmentUnpaid(commitmentId: string, month: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('commitment_payments')
        .delete()
        .eq('commitment_id', commitmentId)
        .eq('month', month);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking commitment as unpaid:', error);
      throw error;
    }
  }

  async getCommitmentPayments(userId: number, month: string): Promise<CommitmentPayment[]> {
    try {
      const { data, error } = await supabase
        .from('commitment_payments')
        .select('*')
        .eq('paid_by', userId)
        .eq('month', month);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching commitment payments:', error);
      return [];
    }
  }
}

export const newStorage = new NewDatabaseStorage();