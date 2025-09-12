import { OdooService } from '../services/odooService.js';

export class OdooController {
  static async getToken(req, res) {
    try {
      const profileId = req.user?.id;
      if (!profileId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = await OdooService.getToken(profileId);
      return res.json(token);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch token' });
    }
  }

  static async createToken(req, res) {
    try {
      const profileId = req.user?.id;
      if (!profileId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = await OdooService.createToken(profileId);
      return res.json(token);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to generate token' });
    }
  }

  static async getAggregatedData(req, res) {
    try {
      const token = req.headers['x-api-token'];
      if (!token) return res.status(401).json({ error: 'Missing API token' });
      const data = await OdooService.getAggregatedData(token);
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch aggregated data' });
    }
  }
}
