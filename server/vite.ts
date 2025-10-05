import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer, createLogger } from 'vite';
import { type Server } from 'http';

import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viteLogger = createLogger();

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    watch: {
      usePolling: true,
    },
    host: true,
  };

  const vite = await createViteServer({
    configFile: path.resolve(__dirname, '..', 'vite.config.ts'),
    root: path.resolve(__dirname, '../client'),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, '..', 'client', 'index.html');

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, '../dist/client');

  // Check if the build directory exists
  if (!fs.existsSync(distPath)) {
    console.error(`Build directory not found: ${distPath}`);
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  // Serve static files with proper caching headers
  app.use(
    express.static(distPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set proper MIME types and caching
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        }
      },
    })
  );

  // Health check for static assets
  app.get('/health/static', (req, res) => {
    const indexPath = path.resolve(distPath, 'index.html');
    const exists = fs.existsSync(indexPath);
    res.json({
      status: exists ? 'OK' : 'ERROR',
      static_files: exists,
      build_path: distPath,
      timestamp: new Date().toISOString(),
    });
  });

  // Fall through to index.html for SPA routing
  app.use('*', (req, res) => {
    const indexPath = path.resolve(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built. Please run build command first.');
    }
  });
}
