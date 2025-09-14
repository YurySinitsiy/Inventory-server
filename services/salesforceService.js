import { SALESFORCE } from '../config/salesforce.js';

export class SalesforceService {
  /**
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  static async saveProfileDraft(profileData) {
    const data = {
      name: profileData.name,
      surname: profileData.surname,
      phone: profileData.phone,
      email: profileData.email,
      accountName: profileData.accountName,
    };
    return prisma.salesforce.upsert({
      where: { profileId: profileData.id },
      update: data,
      create: {
        ...data,
        profile: {
          connect: { id: profileData.id },
        },
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

      const accountData = await this.createSalesforceAccount(
        profileData,
        tokenData,
        contactData.id
      );

      updateData.salesforceId = contactData.id;
      updateData.accountId = accountData.id;
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
   * @param {string} accountId
   * @returns {Promise<Object>}
   */
  static async createSalesforceContact(profileData, tokenData, accountId) {
    const userData = {
      FirstName: profileData.name,
      LastName: profileData.surname,
      Phone: profileData.phone,
      Email: profileData.email,
      AccountId: accountId,
    };
    return await this.createSalesforceUser(tokenData, 'Contact', userData);
  }

  /**
   * @param {Object} profileData
   * @param {Object} tokenData
   * @returns {Promise<string>}
   */
  static async createSalesforceAccount(profileData, tokenData) {
    const userData = {
      Name: profileData.accountName,
    };
    return await this.createSalesforceUser(tokenData, 'Account', userData);
  }

  /**
   * @param {Object} tokenData
   * @param {string} type
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  static async createSalesforceUser(tokenData, type, userData) {
    if (!tokenData.access_token || !tokenData.instance_url) {
      throw new Error('Invalid Salesforce token data');
    }
    const url = `${tokenData.instance_url}/services/data/v64.0/sobjects/${type}/`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Salesforce create account error:', text);
      throw new Error('Failed to create Salesforce account');
    }

    const data = await res.json();
    return data;
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

    await Promise.all([
      this.unlinkAccount(profileData, accessToken),
      this.unlinkContact(profileData, accessToken),
    ]);

    await prisma.salesforce.delete({
      where: { profileId },
    });
  }

  /**
   * @param {Object} profileData
   * @param {string} accessToken
   * @returns {Promise<void>}
   */
  static async unlinkContact(profileData, accessToken) {
    const url = this.getDeleteUrl(
      profileData.salesforceId,
      profileData.instanceUrl,
      'Contact'
    );

    await this.unlinkRequest(url, accessToken);
  }

  /**
   * @param {Object} profileData
   * @param {string} accessToken
   * @returns {Promise<void>}
   */
  static async unlinkAccount(profileData, accessToken) {
    const url = this.getDeleteUrl(
      profileData.accountId,
      profileData.instanceUrl,
      'Account'
    );
    await this.unlinkRequest(url, accessToken);
  }

  /**
   * @param {string} url
   * @param {string} accessToken
   * @returns {Promise<void>}
   */
  static async unlinkRequest(url, accessToken) {
    const fetchRes = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!fetchRes.ok) {
      const text = await fetchRes.text();
      console.error('Salesforce deletion error', text);
      throw new Error('Failed to delete Salesforce profile');
    }
  }

  /**
   * @param {string} code
   * @returns {URLSearchParams}
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
   * @param {Object} profileData
   * @param {string} profileData.id
   * @returns {string}
   */
  static getOauthUrl(profileData) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SF_CLIENT_ID,
      redirect_uri: process.env.SF_REDIRECT_URI,
      state: profileData.id,
    });
    return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`;
  }

  /**
   * @param {string} salesforceId
   * @param {string} instanceUrl
   * @param {string} type
   * @returns {string}
   */
  static getDeleteUrl(salesforceId, instanceUrl, type) {
    if (!salesforceId) throw new Error('Salesforce ID is required');
    const baseUrl = instanceUrl || SALESFORCE.instanceUrl;
    return `${baseUrl}/services/data/v64.0/sobjects/${type}/${salesforceId}`;
  }
}
