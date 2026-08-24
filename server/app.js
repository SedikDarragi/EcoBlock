import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8100',
      'http://localhost:4200',
      'http://localhost:3000',
      'capacitor://localhost',
      'http://localhost',
      'ionic://localhost',
      'https://ecoblock-network.netlify.app'
    ];

    if (process.env.CLIENT_URL) {
      process.env.CLIENT_URL.split(',').map(url => url.trim()).forEach(url => {
        if (url && allowedOrigins.indexOf(url) === -1) {
          allowedOrigins.push(url);
        }
      });
    }

    const isNetlify = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);

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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.options('*', cors(corsOptions));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import productRoutes from './routes/products.js';

app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
