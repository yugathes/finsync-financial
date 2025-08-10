
import type { Express } from "express";
import { createServer, type Server } from "http";
import userRoutes from "./user/routes";
import commitmentRoutes from "./commitment/routes";
import incomeRoutes from "./income/routes";
import paymentRoutes from "./payment/routes";
import dashboardRoutes from "./dashboard/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "API is working", timestamp: new Date().toISOString() });
  });

  // User routes
  app.use("/api/user", userRoutes);
  // Commitment routes
  app.use("/api/commitments", commitmentRoutes);
  // Income routes
  app.use("/api/monthly-income", incomeRoutes);
  // Payment routes
  app.use("/api", paymentRoutes);

  // Dashboard routes
  app.use("/api/dashboard", dashboardRoutes);
  // Return the HTTP server instance for use in index.ts
  const httpServer = createServer(app);
  return httpServer;
}
