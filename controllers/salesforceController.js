import { SalesforceService } from '../services/salesforceService.js';

export class SalesforceController {
  static async startSalesforce(req, res) {
    const profileData = req.body;
    if (!profileData) {
      return res.status(400).json({ error: 'Missing user ID or profile data' });
    }
    try {
      await SalesforceService.saveProfileDraft(profileData);
      const salesforcecId = await SalesforceService.linkSalesforce(
        profileData.id
      );
      res.json(salesforcecId);
    } catch (err) {
      console.error('Salesforce start failed:', err);
      res.status(500).json({ error: 'Salesforce start failed' });
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
