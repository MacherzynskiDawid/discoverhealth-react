import express from 'express';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('./database/discoverhealth.db');

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to perform this action' });
  }
  next();
};

// GET /api/resources/:region
router.get('/resources/:region', (req, res) => {
  const { region } = req.params;
  try {
    const resources = db
      .prepare('SELECT * FROM healthcare_resources WHERE region = ?')
      .all(region);
    res.json(resources);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/resources
router.post('/resources', requireLogin, (req, res) => {
  const { name, category, country, region, lat, lon, description } = req.body;
  if (!name || !category || !country || !region || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare(
      'INSERT INTO healthcare_resources (name, category, country, region, lat, lon, description, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
    );
    const info = stmt.run(name, category, country, region, lat, lon, description || '');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/resources/:id/recommend
router.post('/resources/:id/recommend', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare(
      'UPDATE healthcare_resources SET recommendations = recommendations + 1 WHERE id = ?'
    );
    const info = stmt.run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ message: 'Recommendation added' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;