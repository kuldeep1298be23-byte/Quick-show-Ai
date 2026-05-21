import express from 'express';
import cors from 'cors';
import './configs/env.js';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from './inngest/index.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app=express();
const port=3000;
await connectDB()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.VITE_CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/quickshow.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

//stripe webhooks route
app.use('/api/stripe',express.raw({type:'application/json'}),stripeWebhooks)

//middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(clerkMiddleware())

//api routes
app.get('/',(req,res)=> res.send("server is live!!!!!!!!!!!!"));
app.use('/api/inngest',serve({client: inngest, functions }))
app.use('/api/show',showRouter)
app.use('/api/booking',bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)
app.use('/api/chat',chatRouter)

app.listen(port,()=>console.log(`server running at http://localhost:${port}`));
