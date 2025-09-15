import { SupportService } from '../services/supportService.js';

export class SupportController {
  static async sendMessage(req, res) {
    try {
      const user = req.user;
      const data = req.body;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await SupportService.sendMessage(user, data);
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch token' });
    }
  }
}
