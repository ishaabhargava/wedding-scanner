import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config/env.js';
import publicRoutes from './routes/public.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible media and scripts for client SPA
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-origin resource sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching frontend
      if (!origin || origin.startsWith('http://localhost') || origin === config.frontendUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/production for custom domains
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

// Mount API routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Root route for backend status verification
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    service: 'Wedding Photo-Sharing API Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/public/health',
      config: '/api/public/config',
    },
    message: 'Backend server is active and running successfully!',
  });
});

// Serve static frontend build if present (for single-container/Render deployments)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const localClientDist = path.resolve(process.cwd(), 'client-dist');

const staticPath = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(localClientDist)
  ? localClientDist
  : null;

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.baseUrl}` });
});

// Global error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

export default app;
