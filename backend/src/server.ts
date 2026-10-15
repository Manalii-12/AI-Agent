import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  checkReturnEligibility,
  resetOrders,
} from './controllers/orderController';
import { getAllProducts, getProductById } from './controllers/productController';
import { handleVoiceChat } from './controllers/chatController';
import { createCallSummary, getAllCallSummaries } from './controllers/summaryController';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Enable CORS for frontend (Vercel deployment + Localhost)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health check endpoint for Render / Uptime monitors
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Aura Skincare AI Voice Agent Backend',
    database: 'PostgreSQL with Prisma ORM',
    timestamp: new Date().toISOString(),
  });
});

// Order Routes
app.get('/api/orders', getAllOrders);
app.get('/api/orders/:id', getOrderById);
app.post('/api/orders', createOrder);
app.patch('/api/orders/:id/cancel', cancelOrder);
app.get('/api/orders/:id/return-eligibility', checkReturnEligibility);
app.post('/api/orders/reset', resetOrders);

// Product Routes
app.get('/api/products', getAllProducts);
app.get('/api/products/:id', getProductById);

// Voice Agent AI Chat & Call Summary Routes
app.post('/api/chat', handleVoiceChat);
app.post('/api/summary', createCallSummary);
app.get('/api/summaries', getAllCallSummaries);

// Boot server and auto-seed if empty
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Aura Skincare Node.js Backend listening on port ${PORT}`);
  try {
    if (process.env.AUTO_SEED !== 'false') {
      await seedDatabase();
    }
  } catch (err) {
    console.warn('Auto-seed skipped or database connecting...');
  }
});
