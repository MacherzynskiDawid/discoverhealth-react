import express from 'express';
import db from '../db.mjs';

const router = express.Router();

// Task 1: Get all healthcare resources by region
router.get('/resources/:region', (req, res) => {
    try {
        const { region } = req.params;
        const stmt = db.prepare('SELECT * FROM healthcare_resources WHERE region = ?');
        const rows = stmt.all(region);
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Task 2: Add a new healthcare resource
router.post('/resources', (req, res) => {
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

// Task 3: Recommend a healthcare resource
router.post('/resources/:id/recommend', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('UPDATE healthcare_resources SET recommendations = recommendations + 1 WHERE id = ?');
        const info = stmt.run(id);
        if (info.changes === 0) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(200).json({ message: 'Recommendation added' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;