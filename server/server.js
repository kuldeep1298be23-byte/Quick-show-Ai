import express from 'express';
import cors from 'cors';
import './configs/env.js';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect Database
await connectDB();

// Allowed Frontend URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://quick-show-kuldeep.netlify.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.VITE_CLIENT_URL,
].filter(Boolean);

console.log('Allowed Origins:', allowedOrigins);

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman, mobile apps, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/quickshow.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    console.error(`❌ Blocked by CORS: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Origin',
    'Accept',
    'X-Requested-With'
  ],
  credentials: true,
};

// Stripe Webhook Route
// Must come BEFORE express.json()
app.use(
  '/api/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
);

// CORS Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Other Middleware
app.use(express.json());
app.use(clerkMiddleware());

// Health Check
app.get('/', (req, res) => {
  res.send('Server is live!');
});

// API Routes
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
