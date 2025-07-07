import { eq, desc } from 'drizzle-orm';
import { db, supabase } from './db';
import { users, commitments, type User, type InsertUser, type Commitment, type InsertCommitment } from "@shared/schema";

// Storage interface for financial commitment tracker
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserIncome(userId: number, income: string): Promise<User>;
  
  // Commitment methods
  getCommitmentsByUser(userId: number): Promise<Commitment[]>;
  createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment>;
  updateCommitment(id: number, updates: Partial<Commitment>): Promise<Commitment>;
  deleteCommitment(id: number): Promise<void>;
  toggleCommitmentPaid(id: number): Promise<Commitment>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return undefined;
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Database error:', error);
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
      
      if (error) {
        console.error('Error fetching user by username:', error);
        return undefined;
      }
      
      return data || undefined;
    } catch (error) {
      console.error('Database error:', error);
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
      
      if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async updateUserIncome(userId: number, income: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ monthlyIncome: income, updatedAt: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user income:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Commitment methods
  async getCommitmentsByUser(userId: number): Promise<Commitment[]> {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching commitments:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment> {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .insert(commitment)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating commitment:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async updateCommitment(id: number, updates: Partial<Commitment>): Promise<Commitment> {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating commitment:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async deleteCommitment(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('commitments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting commitment:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async toggleCommitmentPaid(id: number): Promise<Commitment> {
    try {
      // First get the current commitment
      const { data: commitment, error: fetchError } = await supabase
        .from('commitments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !commitment) {
        throw new Error('Commitment not found');
      }
      
      // Then update it
      const { data, error } = await supabase
        .from('commitments')
        .update({ isPaid: !commitment.isPaid, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error toggling commitment paid status:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
