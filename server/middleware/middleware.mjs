import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('./database/discoverhealth.db');
const SQLiteSessionStore = SQLiteStore(session);

export const requestLogger = (req, res, next) => {
  next(); // Pass through without logging
};

export const sessionMiddleware = session({
  store: new SQLiteSessionStore({
    db: 'sessions.db',
    dir: './database',
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true, // Prevent JavaScript access
    sameSite: 'strict', // Prevent CSRF
    path: '/' // Ensure cookie is sent for all routes
  },
  rolling: true, // Refresh session on each request
  name: 'discoverhealth.sid' // Custom cookie name
});

export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to perform this action' });
  }
  next();
};