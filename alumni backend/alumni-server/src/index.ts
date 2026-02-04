// src/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import fs from 'fs-extra';
import { connectMongoDB } from './mongodb.js';

import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import contentRoutes from './routes/content-mongo.js';
import mentorRoutes from './routes/mentors-mongo.js';
import supportRoutes from './routes/support-mongo.js';
import chatsRoutes from './routes/chats-mongo.js';
import applicationsRoutes from './routes/applications-mongo.js';
import disburseRoutes from './routes/disburse-mongo.js';
import paymentsRoutes from './routes/payments-mongo.js';
import donationsRoutes from './routes/donations-mongo.js';
import pinRoutes from './routes/pin-mongo.js';
import accountSettingsRoutes from './routes/account-settings-mongo.js';
import adminRoutes from './routes/admin-mongo.js';
import automatedDeductionsRoutes from './routes/automated-deductions.js';
import reportsRoutes from './routes/reports.js';

import { optionalAuth } from './middleware/optionalAuth.js';
import { auditRequest } from './middleware/auditRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/* =======================
   Middleware
======================= */

// CORS configuration with origin function for flexibility
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://alumni-frontend-seven.vercel.app',
  'https://alumni-frontend-git-main-byaxydraxler256-6957s-projects.vercel.app',
];

app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server & tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error('❌ Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// VERY IMPORTANT — handle preflight
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach req.user when a token is present (doesn't block), then record "footprints" for mutating requests.
app.use(optionalAuth);
app.use(auditRequest);

/* =======================
   Static uploads
======================= */

const uploadPath = path.join(__dirname, '..', UPLOAD_DIR);
fs.ensureDirSync(uploadPath);
app.use(`/${UPLOAD_DIR}`, express.static(uploadPath));

/* =======================
   Routes
======================= */

app.use('/api/auth', authRoutes);
app.use('/api/auth', accountSettingsRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chat', chatsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/disburse', disburseRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/automated-deductions', automatedDeductionsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/pin', pinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);

/* =======================
   Health checks
======================= */

app.get('/', (_req, res) =>
  res.send('UCU Alumni Circle Backend running')
);

app.get('/api/test', (_req, res) =>
  res.json({ ok: true, timestamp: new Date() })
);

/* =======================
   Error handling
======================= */

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* =======================
   Start server AFTER DB
======================= */

(async () => {
  const connected = await connectMongoDB();
  if (!connected) {
    console.error('❌ MongoDB connection failed');
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
