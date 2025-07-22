import express from 'express';
import cors from 'cors';
import ViteExpress from 'vite-express';
import rateLimit from 'express-rate-limit';
import { requestLogger, sessionMiddleware } from './middleware/middleware.mjs';
import routeResources from './routes/routeResources.mjs';
import routeUsers from './routes/routeUsers.mjs';
import userController from './controllers/userController.mjs';

// Task 1: Initialize Express app and configure CORS for regional resource lookup
const app = express();
const PORT = 3000;

// Restrict CORS to specific origins
const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Task 3: Configure rate limiting for security, indirectly supporting recommendation endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

app.use(express.json());

// Security: Handle invalid JSON to prevent injection attacks
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Task 1 & 3: Apply middleware for logging and session management
app.use(requestLogger);
app.use(sessionMiddleware);

// Task 1: Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running' });
});

// Task 1: Route for user-related endpoints (placeholder for future login functionality)
app.use('/api/users', routeUsers);

// Task 1 & 3: Route for resource-related endpoints (handles lookup and recommendations)
app.use('/api', routeResources);

// Security: General error handler to catch and log server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on http://localhost:${PORT}`)
);