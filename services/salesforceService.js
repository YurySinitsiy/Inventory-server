import { SALESFORCE } from '../config/salesforce.js';

export class SalesforceService {
  /**
   * @param {string} profileId
   * @param {Object} profileData
   * @returns {Promise<void>}
   */
  static async saveProfileDraft(profileId, profileData) {
    const data = {
      name: profileData.name,
      surname: profileData.surname,
      phone: profileData.phone,
      email: profileData.email,
      accountName: profileData.accountName,
    };
    return prisma.salesforce.upsert({
      where: { profileId },
      update: { ...data },
      create: {
        profileId,
        ...data,
      },
    });
  }

  /**
   * @param {string} code
   * @returns {Promise<Object>}
   */
  static async exchangeCodeForToken(code) {
    const params = this.getAuthCodeUrl(code);
    const res = await fetch(SALESFORCE.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Salesforce token error', errorText);
      throw new Error('Failed to exchamge code for token');
    }

    const data = await res.json();
    return data;
  }

  /**
   * @param {string} profileId
   * @param {string} code
   * @returns {Promise<void>}
   */
  static async linkSalesforce(profileId, code) {
    const tokenData = await this.exchangeCodeForToken(code);
    const profileData = await this.getProfileDraft(profileId);

    const updateData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
    };

    if (profileData) {
      const contactData = await this.createSalesforceContact(
        profileData,
        tokenData
      );
      updateData.salesforceId = contactData.id;
    }

    await prisma.salesforce.update({
      where: { profileId },
      data: updateData,
    });
  }

  /**
   * @param {string} profileId
   * @returns {Promise<Object>}
   */
  static async getProfileDraft(profileId) {
    const record = await prisma.salesforce.findUnique({ where: { profileId } });
    if (!record) return null;
    return {
      name: record.name,
      surname: record.surname,
      phone: record.phone,
      email: record.email,
      accountName: record.accountName,
    };
  }

  /**
   * @param {Object} profileData
   * @param {Object} tokenData
   * @returns {Promise<Object>}
   */

  static async createSalesforceContact(profileData, tokenData) {
    if (!tokenData.access_token || !tokenData.instance_url) {
      throw new Error('Invalid Salesforce token data');
    }

    const accountId = await this.createSalesforceAccount(
      profileData.accountName,
      tokenData
    );

    const url = `${tokenData.instance_url}/services/data/v64.0/sobjects/Contact/`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        FirstName: profileData.name,
        LastName: profileData.surname,
        Phone: profileData.phone,
        Email: profileData.email,
        AccountId: accountId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Salesforce create contact error:', text);
      throw new Error('Failed to create Salesforce contact');
    }

    const data = await res.json();
    return data;
  }

  /**
   * @param {string} accountName
   * @param {Object} tokenData
   * @returns {Promise<string>}
   */
  static async createSalesforceAccount(accountName, tokenData) {
    const url = `${tokenData.instance_url}/services/data/v64.0/sobjects/Account/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Name: accountName }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Salesforce create account error:', text);
      throw new Error('Failed to create Salesforce account');
    }

    const data = await res.json();
    return data.id;
  }

  /**
   * @param {string} profileId
   * @returns {Promise<string>}
   */
  static async getSalesforceId(profileId) {
    const record = await prisma.salesforce.findUnique({
      where: { profileId },
      select: { salesforceId: true },
    });

    return record || { salesforceId: null };
  }

  /**
   * @param {string} profileId
   * @returns {Promise<Object>}
   */
  static async getAccessToken(profileId) {
    const profileData = await prisma.salesforce.findUnique({
      where: { profileId },
    });

    if (!profileData) throw new Error('Salesforce profile data not found');

    const { refreshToken } = profileData;
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', SALESFORCE.clientId);
    params.append('client_secret', SALESFORCE.clientSecret);
    params.append('refresh_token', refreshToken);

    const res = await fetch(SALESFORCE.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) throw new Error('Failed to refresh Salesforce token');

    const data = await res.json();
    const accessToken = data.access_token;

    await prisma.salesforce.update({
      where: { profileId },
      data: { accessToken },
    });

    return { profileData, accessToken };
  }

  /**
   * @param {string} profileId
   * @returns {Promise<void>}
   */
  static async unlinkSalesforce(profileId) {
    const { profileData, accessToken } = await this.getAccessToken(profileId);
    if (!profileData?.salesforceId) return;

    const url = this.getDeleteUrl(
      profileData.salesforceId,
      profileData.instanceUrl
    );

    const fetchRes = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!fetchRes.ok) {
      const text = await fetchRes.text();
      console.error('Salesforce deletion error', text);
      throw new Error('Failed to delete Salesforce profile');
    }

    await prisma.salesforce.delete({
      where: { profileId },
    });
  }

  /**
   * @param {string} code
   * @returns {string}
   */
  static getAuthCodeUrl(code) {
    return new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: SALESFORCE.clientId,
      client_secret: SALESFORCE.clientSecret,
      redirect_uri: SALESFORCE.redirectUri,
    });
  }

  /**
   * @param {string} profileId
   * @returns {string}
   */
  static getOauthUrl(profileId) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SF_CLIENT_ID,
      redirect_uri: process.env.SF_REDIRECT_URI,
      state: profileId,
    });
    return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`;
  }

  /**
   * @param {string} profileId
   * @param {string} instanceUrl
   * @returns {string}
   */
  static getDeleteUrl(salesforceId, instanceUrl) {
    if (!salesforceId) throw new Error('Salesforce ID is required');
    const baseUrl = instanceUrl || SALESFORCE.instanceUrl;
    return `${baseUrl}/services/data/v64.0/sobjects/Contact/${salesforceId}`;
  }
}
