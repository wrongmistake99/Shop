// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { supabase } from './config/supabase.js';

// Import all routers using ESM syntax (no require!)
import productsRouter from './routes/products.js';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import recordsRouter from './routes/records.js';          // ← Fixed here

export function createApp() {
  const app = express();

  // Security & logging middleware
  app.use(helmet());
  app.use(morgan('dev'));

  // CORS configuration (allow frontend origin)
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing (increased limit for larger payloads)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root route - welcome message
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: "Welcome to JurisonShop Backend API! 🚀",
      documentation: {
        health: "/api/health - Check server status",
        testDb: "/api/test-db - Test Supabase connection",
        products: "/api/products - List all products",
        transactions: "/api/transactions - List all transactions",
        dashboard: "/api/dashboard - Real-time business stats",
        records: "/api/records?type=inventory|transactions - View history",
        createTransaction: "POST /api/transactions - Create new transaction"
      },
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  // Supabase connection test
  app.get('/api/test-db', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(3);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Supabase connection successful!',
        row_count: data?.length || 0,
        sample: data
      });
    } catch (err) {
      console.error('DB test error:', err.message);
      res.status(500).json({
        success: false,
        error: err.message,
        hint: 'Check .env keys + table existence + RLS (service_role bypasses RLS)'
      });
    }
  });

  // Mount all routers
  app.use('/api/products', productsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/records', recordsRouter);                // ← Fixed here

  // 404 handler - must be after all other routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Global error:', err.stack || err);
    
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  return app;
}