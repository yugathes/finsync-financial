import { Express } from "express";
import { createServer, Server } from "http";
import { supabase } from "./db";
import { newStorage } from "./storage-new";

export async function registerNewRoutes(app: Express): Promise<Server> {
  // Helper function to get current month
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "New API is working", timestamp: new Date().toISOString() });
  });

  // Monthly Income Routes
  app.get("/api/monthly-income/:userId/:month", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month;
      
      const income = await newStorage.getMonthlyIncome(userId, month);
      
      if (!income) {
        return res.status(404).json({ error: "Monthly income not found" });
      }
      
      res.json(income);
    } catch (error: any) {
      console.error('Error fetching monthly income:', error);
      res.status(500).json({ error: "Failed to fetch monthly income", details: error.message });
    }
  });

  app.post("/api/monthly-income", async (req, res) => {
    try {
      const { userId, month, amount } = req.body;
      
      if (!userId || !month || !amount) {
        return res.status(400).json({ error: "Missing required fields: userId, month, amount" });
      }
      
      const income = await newStorage.setMonthlyIncome(userId, { month, amount });
      res.json(income);
    } catch (error: any) {
      console.error('Error setting monthly income:', error);
      res.status(400).json({ error: "Failed to set monthly income", details: error.message });
    }
  });

  app.put("/api/monthly-income/:userId/:month", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month;
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Missing required field: amount" });
      }
      
      const income = await newStorage.updateMonthlyIncome(userId, month, amount);
      res.json(income);
    } catch (error: any) {
      console.error('Error updating monthly income:', error);
      res.status(400).json({ error: "Failed to update monthly income", details: error.message });
    }
  });

  // Commitment Routes
  app.get("/api/commitments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const commitments = await newStorage.getCommitmentsByUser(userId);
      res.json(commitments);
    } catch (error: any) {
      console.error('Error fetching commitments:', error);
      res.status(500).json({ error: "Failed to fetch commitments", details: error.message });
    }
  });

  app.get("/api/commitments/user/:userId/month/:month", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month;
      
      const commitments = await newStorage.getCommitmentsForMonth(userId, month);
      res.json(commitments);
    } catch (error: any) {
      console.error('Error fetching commitments for month:', error);
      res.status(500).json({ error: "Failed to fetch commitments for month", details: error.message });
    }
  });

  app.post("/api/commitments", async (req, res) => {
    try {
      const { userId, type, title, category, amount, recurring, shared, groupId, startDate } = req.body;
      
      if (!userId || !type || !title || !category || !amount || !startDate) {
        return res.status(400).json({ 
          error: "Missing required fields: userId, type, title, category, amount, startDate" 
        });
      }
      
      const commitment = await newStorage.createCommitment({
        userId,
        type,
        title,
        category,
        amount,
        recurring: recurring ?? true,
        shared: shared ?? false,
        groupId,
        startDate
      });
      
      res.json(commitment);
    } catch (error: any) {
      console.error('Error creating commitment:', error);
      res.status(400).json({ error: "Failed to create commitment", details: error.message });
    }
  });

  app.put("/api/commitments/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      
      const commitment = await newStorage.updateCommitment(id, updates);
      res.json(commitment);
    } catch (error: any) {
      console.error('Error updating commitment:', error);
      res.status(400).json({ error: "Failed to update commitment", details: error.message });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await newStorage.deleteCommitment(id);
      res.json({ success: true, message: "Commitment deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting commitment:', error);
      res.status(400).json({ error: "Failed to delete commitment", details: error.message });
    }
  });

  // Payment Routes
  app.post("/api/commitments/:id/pay", async (req, res) => {
    try {
      const commitmentId = req.params.id;
      const { userId, month, amount } = req.body;
      
      if (!userId || !month || !amount) {
        return res.status(400).json({ error: "Missing required fields: userId, month, amount" });
      }
      
      const payment = await newStorage.markCommitmentPaid(commitmentId, userId, month, amount);
      res.json(payment);
    } catch (error: any) {
      console.error('Error marking commitment as paid:', error);
      res.status(400).json({ error: "Failed to mark commitment as paid", details: error.message });
    }
  });

  app.delete("/api/commitments/:id/pay/:month", async (req, res) => {
    try {
      const commitmentId = req.params.id;
      const month = req.params.month;
      
      await newStorage.markCommitmentUnpaid(commitmentId, month);
      res.json({ success: true, message: "Commitment marked as unpaid" });
    } catch (error: any) {
      console.error('Error marking commitment as unpaid:', error);
      res.status(400).json({ error: "Failed to mark commitment as unpaid", details: error.message });
    }
  });

  app.get("/api/payments/user/:userId/month/:month", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month;
      
      const payments = await newStorage.getCommitmentPayments(userId, month);
      res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: "Failed to fetch payments", details: error.message });
    }
  });

  // Dashboard summary endpoint
  app.get("/api/dashboard/:userId/:month?", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month || getCurrentMonth();
      
      // Get monthly income
      const income = await newStorage.getMonthlyIncome(userId, month);
      
      // Get commitments for the month with payment status
      const commitments = await newStorage.getCommitmentsForMonth(userId, month);
      
      // Calculate totals
      const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const paidCommitments = commitments
        .filter(c => c.isPaid)
        .reduce((sum, c) => sum + (parseFloat(c.amountPaid || c.amount)), 0);
      const unpaidCommitments = commitments.filter(c => !c.isPaid);
      
      const summary = {
        month,
        income: income ? parseFloat(income.amount) : 0,
        totalCommitments,
        paidCommitments,
        remainingCommitments: totalCommitments - paidCommitments,
        availableBalance: (income ? parseFloat(income.amount) : 0) - paidCommitments,
        commitments: commitments.length,
        unpaidCount: unpaidCommitments.length,
        commitmentsList: commitments
      };
      
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ error: "Failed to fetch dashboard summary", details: error.message });
    }
  });

  const server = createServer(app);
  return server;
}