import ResourceDAO from '../daos/resourceDAO.mjs';
import ReviewDAO from '../daos/reviewDAO.mjs';

class ResourceController {
  constructor() {
    this.resourceDAO = new ResourceDAO('./database/discoverhealth.db');
    this.reviewDAO = new ReviewDAO('./database/discoverhealth.db');
  }

  getResourcesByRegion(req, res) {
    try {
      const resources = this.resourceDAO.getResourcesByRegion(req.params.region);
      res.json(resources);
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }

  createResource(req, res) {
    const { name, category, country, region, lat, lon, description } = req.body;
    if (!name || !category || !country || !region || !lat || !lon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const resourceId = this.resourceDAO.createResource({
        name,
        category,
        country,
        region,
        lat,
        lon,
        description
      });
      res.status(201).json({ id: resourceId });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }

  recommendResource(req, res) {
    const { id } = req.params;
    try {
      const success = this.resourceDAO.incrementRecommendation(id);
      if (!success) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      res.json({ message: 'Recommendation added' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }

  createReview(req, res) {
    const { id } = req.params;
    const { review } = req.body;
    const userId = req.session.user.id;

    if (!review || review.trim() === '') {
      return res.status(400).json({ error: 'Review cannot be empty' });
    }

    try {
      const resource = this.reviewDAO.getResourceExists(id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const reviewId = this.reviewDAO.createReview(id, userId, review);
      res.status(201).json({ id: reviewId, message: 'Review added successfully' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }
}

export default new ResourceController();