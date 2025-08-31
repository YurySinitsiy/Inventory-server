import upsertProfile from '../services/upsertProfile.js';
import upsertSocialProfile from '../services/upsertSocialProfile.js';

export class AuthController {
  static async socialLogin(req, res) {
    try {
      const { user } = req.body;
      if (!user?.id) {
        return res.status(400).json({ error: 'User data required' });
      }
      
      const profile = await upsertSocialProfile(user);
      res.json(profile);
    } catch (error) {
      console.error('Social login error:', error);
      res.status(500).json({ error: 'Auth error' });
    }
  }

  static async signup(req, res) {
    try {
      const { userId, data } = req.body;
      const profile = await upsertProfile(userId, data);
      res.json(profile);
    } catch (error) {
      console.error('Registration:', error);
      res.status(500).json({ error: 'Auth error' });
    }
  }
}
