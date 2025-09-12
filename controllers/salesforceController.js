import { SalesforceService } from '../services/salesforceService.js';

export class SalesforceController {
  static async startSalesforce(req, res) {
    const { profileId, profileData } = req.body;
    if (!profileId || !profileData) {
      return res.status(400).json({ error: 'Missing user ID or profile data' });
    }
    try {
      await SalesforceService.saveProfileDraft(profileId, profileData);
      const oauthUrl = SalesforceService.getOauthUrl(profileId);
      res.json({ oauthUrl });
    } catch (err) {
      console.error('Salesforce start failed:', err);
      res.status(500).json({ error: 'Salesforce start failed' });
    }
  }

  static async linkSalesforce(req, res) {
    const { code, state: profileId } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
      await SalesforceService.linkSalesforce(profileId, code);
      res.redirect(
        `${process.env.FRONTEND_URL}/salesforce/success?id=${profileId}`
      );
    } catch (err) {
      console.error(err);
      res.status(500).send('Salesforce link failed');
    }
  }

  static async getSalesforceId(req, res) {
    const { id: userId } = req.params;
    try {
      const data = await SalesforceService.getSalesforceId(userId);
      if (!data) return res.json({ salesforceId: null });
      res.json(data.salesforceId);
    } catch (err) {
      console.error(err);
      res.status(500).send('Salesforce fetch data failed');
    }
  }

  static async unlinkSalesforce(req, res) {
    const { id: profileId } = req.body;
    if (!profileId)
      return res.status(400).json({ error: 'User ID is required' });
    try {
      await SalesforceService.unlinkSalesforce(profileId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send('Salesforce unlink failed');
    }
  }
}
