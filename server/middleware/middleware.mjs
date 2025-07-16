import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import Database from 'better-sqlite3';

const db = new Database('./database/discoverhealth.db');
const SQLiteSessionStore = SQLiteStore(session);

// Configurable debug logging
export const requestLogger = (req, res, next) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
};

// Session middleware
export const sessionMiddleware = session({
  store: new SQLiteSessionStore({
    db: 'sessions.db',
    dir: './database',
  }),
  secret: 'your-secret-key', // Replace with a secure key in production
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
});

// Authentication middleware
export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to perform this action' });
  }
  next();
};