import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { handleWebhook } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Environment variables - ALL from .env, NEVER hardcoded
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// CRITICAL: Stripe webhook must be registered BEFORE express.json() middleware
// Stripe requires raw body for signature verification
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Body parsing (AFTER webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
