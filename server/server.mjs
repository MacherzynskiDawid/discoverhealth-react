import express from 'express';
import cors from 'cors';
import ViteExpress from 'vite-express';
import rateLimit from 'express-rate-limit';
import { requestLogger, sessionMiddleware } from './middleware/middleware.mjs';
import routeResources from './routeResources.mjs';
import routeUsers from './routeUsers.mjs';
import userController from './controllers/userController.mjs';

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

// Rate limit login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

app.use(express.json());

// Error handling for invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

app.use(requestLogger);
app.use(sessionMiddleware);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running' });
});

// User routes
app.use('/api/users', routeUsers);

// Resources routes
app.use('/api', routeResources);

// General error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on http://localhost:${PORT}`)
);