
import type { Express } from "express";
import { createServer, type Server } from "http";
import userRoutes from "./user/routes";
import commitmentRoutes from "./commitment/routes";
import incomeRoutes from "./income/routes";
import paymentRoutes from "./payment/routes";
import dashboardRoutes from "./dashboard/routes";
import { setupSwagger } from "./utils/swagger";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Documentation
  setupSwagger(app);

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is working
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 message:
   *                   type: string
   *                   example: API is working
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
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
