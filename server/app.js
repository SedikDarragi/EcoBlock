import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import productRoutes from './routes/products.js';

// Initialize Express
const app = express();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8100', // Ionic dev server
      'http://localhost:4200', // Angular dev server
      'http://localhost:3000', // React/Vue
      'capacitor://localhost', // Capacitor
      'http://localhost',      // Fallback
      'ionic://localhost',     // Ionic iOS/Android
      'https://ecoblock-network.netlify.app' // Deployed client
    ];

    // Allow deployed frontend origins configured via env var (comma-separated)
    if (process.env.CLIENT_URL) {
      process.env.CLIENT_URL.split(',').map(url => url.trim()).forEach(url => {
        if (url && allowedOrigins.indexOf(url) === -1) {
          allowedOrigins.push(url);
        }
      });
    }

    // Allow any Netlify site (e.g. *.netlify.app)
    const isNetlify = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || isNetlify || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (method + path only; never log headers or bodies)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server running on port ${PORT}
  ➡️ Try these endpoints:
     - POST   /api/auth/register
     - POST   /api/auth/login
     - GET    /api/health (status check)
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  server.close(() => process.exit(1));
});