import ResourceDAO from '../daos/resourceDAO.mjs';
import ReviewDAO from '../daos/reviewDAO.mjs';
import xss from 'xss';

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

    // Validate inputs with regex
    const validStringPattern = /^[0-9A-Za-z\s_]+$/;
    if (!name || !validStringPattern.test(name)) {
      return res.status(400).json({ error: 'Invalid or missing name' });
    }
    if (!category || !validStringPattern.test(category)) {
      return res.status(400).json({ error: 'Invalid or missing category' });
    }
    if (!country || !validStringPattern.test(country)) {
      return res.status(400).json({ error: 'Invalid or missing country' });
    }
    if (!region || !validStringPattern.test(req.params.region)) {
      return res.status(400).json({ error: 'Invalid or missing region' });
    }
    if (!lat || isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Invalid or missing latitude' });
    }
    if (!lon || isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid or missing longitude' });
    }

    try {
      const resourceId = this.resourceDAO.createResource({
        name: xss(name),
        category: xss(category),
        country: xss(country),
        region: xss(region),
        lat,
        lon,
        description: xss(description)
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

      const reviewId = this.reviewDAO.createReview(id, userId, xss(review));
      res.status(201).json({ id: reviewId, message: 'Review added successfully' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }
}

export default new ResourceController();