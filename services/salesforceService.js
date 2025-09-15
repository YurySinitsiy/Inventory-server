import { SALESFORCE } from '../config/salesforce.js';
import prisma from '../lib/prismaClient.js';
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
   * @param {string} profileId
   * @param {string} code
   * @returns {Promise<void>}
   */
  static async linkSalesforce(profileId) {
    const profileData = await this.getProfileDraft(profileId);
    const tokenData = await this.getAccessToken();

    const accountData = await this.createSalesforceAccount(
      profileData,
      tokenData
    );

    const contactData = await this.createSalesforceContact(
      profileData,
      tokenData,
      accountData.id
    );

    const updateData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
      salesforceId: contactData.id,
      accountId: accountData.id,
    };
    await prisma.salesforce.update({
      where: { profileId },
      data: updateData,
    });

    return await this.getSalesforceData(profileId);
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
  static async getSalesforceData(profileId) {
    const record = await prisma.salesforce.findUnique({
      where: { profileId },
    });

    return record || null;
  }

  /**
   * @returns {Promise<Object>}
   */
  static async getAccessToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', SALESFORCE.clientId);
    params.append('client_secret', SALESFORCE.clientSecret);
    params.append('username', SALESFORCE.username);
    params.append('password', SALESFORCE.password);
    const res = await fetch(`${SALESFORCE.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Salesforce login error:', errText);
      throw new Error('Failed to authenticate with Salesforce');
    }

    return res.json();
  }

  /**
   * @param {string} profileId
   * @returns {Promise<void>}
   */

  static async unlinkSalesforce(profileId) {
    const tokenData = await this.getAccessToken();
    const profileData = await prisma.salesforce.findUnique({
      where: { profileId },
    });
    const accessToken = tokenData.access_token;

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
