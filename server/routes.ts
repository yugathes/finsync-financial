import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./db";
import { insertCommitmentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route to check if API is working
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "API is working" });
  });

  // Test database connection route
  app.get("/api/db-test", async (req, res) => {
    try {
      // Test Supabase connection with a simple query
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.error('Database test error:', error);
        throw error;
      }
      res.json({ status: "Database connected", supabase: "OK", sample: data });
    } catch (error: any) {
      res.status(500).json({ status: "Database error", error: error.message });
    }
  });

  // User profile routes (for financial data, not authentication)
  app.post("/api/profile", async (req, res) => {
    try {
      const { monthlyIncome, userId } = req.body;
      
      // Create or update user profile in our users table
      const { data, error } = await supabase
        .from('users')
        .upsert({ 
          id: userId, 
          monthly_income: monthlyIncome,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      res.json(data);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(400).json({ error: "Failed to update profile", details: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id/income", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { income } = req.body;
      const { data: user, error } = await supabase
        .from('users')
        .update({ monthly_income: income, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update income" });
    }
  });

  // Commitment routes
  app.get("/api/commitments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { data: commitments, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  app.post("/api/commitments", async (req, res) => {
    try {
      const commitmentData = insertCommitmentSchema.parse(req.body);
      const { userId } = req.body;
      const { data: commitment, error } = await supabase
        .from('commitments')
        .insert({ ...commitmentData, user_id: userId })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      res.json(commitment);
    } catch (error) {
      res.status(400).json({ error: "Invalid commitment data" });
    }
  });

  app.put("/api/commitments/:id", async (req, res) => {
    try {
      const id = req.params.id; // Use string ID for UUID
      const updates = req.body;
      const { data: commitment, error } = await supabase
        .from('commitments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      res.json(commitment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update commitment" });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      const id = req.params.id; // Use string ID for UUID
      const { error } = await supabase
        .from('commitments')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commitment" });
    }
  });

  app.put("/api/commitments/:id/toggle", async (req, res) => {
    try {
      const id = req.params.id;
      // This route needs to be implemented based on business logic
      res.status(501).json({ error: "Toggle functionality not yet implemented with Supabase" });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle commitment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
