import type { Express } from 'express';
import { createServer, type Server } from 'http';
import userRoutes from './user/routes';
import commitmentRoutes from './commitment/routes';
import incomeRoutes from './income/routes';
import paymentRoutes from './payment/routes';
import dashboardRoutes from './dashboard/routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for PM2 monitoring
  app.get('/api/health', (req, res) => {
    const healthData = {
      status: 'OK',
      message: 'API is working',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      pid: process.pid,
      version: process.version,
    };
    res.json(healthData);
  });

  // User routes
  app.use('/api/user', userRoutes);
  // Commitment routes
  app.use('/api/commitments', commitmentRoutes);
  // Income routes
  app.use('/api/monthly-income', incomeRoutes);
  // Payment routes
  app.use('/api', paymentRoutes);

  // Dashboard routes
  app.use('/api/dashboard', dashboardRoutes);
  // Return the HTTP server instance for use in index.ts
  const httpServer = createServer(app);
  return httpServer;
}
