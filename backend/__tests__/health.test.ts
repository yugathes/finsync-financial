import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../routes';

describe('API Health Check', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message', 'API is working');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should handle 404 for unknown endpoints', async () => {
    await request(app)
      .get('/api/unknown')
      .expect(404);
  });
});