import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommitmentSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route to check if API is working
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "API is working" });
  });

  // Test database connection route
  app.get("/api/db-test", async (req, res) => {
    try {
      const testUser = await storage.getUser(1);
      res.json({ status: "Database connected", user: testUser });
    } catch (error) {
      res.status(500).json({ status: "Database error", error: error.message });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({ error: "Invalid user data", details: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
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
      const user = await storage.updateUserIncome(userId, income);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update income" });
    }
  });

  // Commitment routes
  app.get("/api/commitments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const commitments = await storage.getCommitmentsByUser(userId);
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  app.post("/api/commitments", async (req, res) => {
    try {
      const commitmentData = insertCommitmentSchema.parse(req.body);
      const { userId } = req.body;
      const commitment = await storage.createCommitment({ ...commitmentData, userId });
      res.json(commitment);
    } catch (error) {
      res.status(400).json({ error: "Invalid commitment data" });
    }
  });

  app.put("/api/commitments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const commitment = await storage.updateCommitment(id, updates);
      res.json(commitment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update commitment" });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCommitment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commitment" });
    }
  });

  app.put("/api/commitments/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const commitment = await storage.toggleCommitmentPaid(id);
      res.json(commitment);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle commitment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
