import express from 'express';
import { requireLogin } from '../middleware/middleware.mjs';
import resourceController from '../controllers/resourceController.mjs';

const router = express.Router();

// GET /api/resources/:region
router.get('/resources/:region', (req, res) => resourceController.getResourcesByRegion(req, res));

// POST /api/resources
router.post('/resources', requireLogin, (req, res) => resourceController.createResource(req, res));

// POST /api/resources/:id/recommend
router.post('/resources/:id/recommend', requireLogin, (req, res) => resourceController.recommendResource(req, res));

// POST /api/resources/:id/reviews
router.post('/resources/:id/reviews', requireLogin, (req, res) => resourceController.createReview(req, res));

export default router;