import express from 'express';
import cors from 'cors';
import ViteExpress from 'vite-express';
import Database from 'better-sqlite3';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';

const app = express();
const PORT = 3000;
const db = new Database('./database/discoverhealth.db');
const SQLiteSessionStore = SQLiteStore(session);

app.use(express.json());
app.use(cors({ origin: `http://localhost:${PORT}`, credentials: true }));
app.use(
  session({
    store: new SQLiteSessionStore({
      db: 'sessions.db',
      dir: './database',
    }),
    secret: 'your-secret-key', // Needs to be replaced
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running' });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = db
      .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
      .get(username, password); // Plaintext for simplicity; use hashing in production
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.user = { id: user.id, username: user.username };
    res.json({ message: 'Login successful', username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Signup route
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, password); // Plaintext for simplicity
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: 'Username already exists or database error' });
  }
});

// Check login status
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// Resources routes (updated in Step 3 for Task 11)
import resourcesRouter from './routes/resources.mjs';
app.use('/api', resourcesRouter);

ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on http://localhost:${PORT}`)
);