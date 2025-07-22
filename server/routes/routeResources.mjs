import express from 'express';
import { requireLogin } from '../middleware/middleware.mjs';
import resourceController from '../controllers/resourceController.mjs';

const router = express.Router();

// GET /api/resources/:region (allow alphanumeric, spaces, underscores)
router.get('/resources/:region([A-Za-z0-9\\s_]+)', (req, res) => resourceController.getResourcesByRegion(req, res));

// POST /api/resources
router.post('/resources', requireLogin, (req, res) => resourceController.createResource(req, res));

// POST /api/resources/:id/recommend (id must be digits)
router.post('/resources/:id(\\d+)/recommend', requireLogin, (req, res) => resourceController.recommendResource(req, res));

// POST /api/resources/:id/reviews (id must be digits)
router.post('/resources/:id(\\d+)/reviews', requireLogin, (req, res) => resourceController.createReview(req, res));

export default router;