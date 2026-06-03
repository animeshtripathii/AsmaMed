/**
 * server/src/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * EXPRESS APPLICATION ENTRY POINT — AasaMedChem Backend (JavaScript Version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';

dotenv.config();

const app = express();

// Trust proxy (essential for rate limiting to get correct client IPs when deployed on Vercel)
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];
// ... (rest of CORS and other middleware) ...
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Apply global rate limiting to all /api routes
app.use('/api', globalLimiter);

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Check the API docs.',
  });
});

app.use((err, _req, res, _next) => {
  console.error('[Global Error Handler]', err.message);

  if (err.message.startsWith('CORS:')) {
    res.status(403).json({ success: false, message: err.message });
    return;
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  });
});

// Connect to Database immediately (Mongoose buffers queries automatically)
connectDB().catch((err) => {
  console.error('[DB] Failed to connect globally:', err);
});

if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT ?? '5000', 10);
  const server = app.listen(PORT, () => {
    console.log(`[Server] AasaMedChem API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
