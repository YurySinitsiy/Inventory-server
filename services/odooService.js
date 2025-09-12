import crypto from 'crypto';
import prisma from '../lib/prismaClient.js';

export class OdooService {
  static async getToken(profileId) {
    const odooData = await prisma.odoo.findUnique({
      where: { profileId },
    });
    if (!odooData) return null;
    return odooData.apiToken;
  }

  static async createToken(profileId) {
    const token = crypto.randomBytes(32).toString('hex');

    const odooData = await prisma.odoo.upsert({
      where: { profileId },
      update: { apiToken: token },
      create: { profileId, apiToken: token },
    });

    return odooData.apiToken;
  }

  static async getAggregatedData(token) {
    const user = await this.getUserByToken(token);
    const userInventories = await this.getUserInventories(user.profileId);

    // return {
    //   user,
    //   userInventories,
    // };

    return userInventories.map((inv) => ({
      templateId: inv.id,
      title: inv.title,
      author: `${user.profile.name} ${user.profile.surname}`,
      //questions: this.aggregateQuestions(inv.items),
    }));
  }

  static async getUserByToken(token) {
    const user = await prisma.odoo.findUnique({
      where: { apiToken: token },
      include: { profile: true },
    });

    if (!user) throw new Error('Invalid API token');
    return user;
  }

  static async getUserInventories(profileId) {
    return await prisma.inventory.findMany({
      where: { ownerId: profileId },
      include: { items: true },
    });
  }

  static aggregateQuestions(items) {
    return [
      ...this.aggregateTextFields(items),
      ...this.aggregateNumberFields(items),
      ...this.aggregateBooleanFields(items),
      ...this.aggregateLinksFields(items),
    ];
  }

  static aggregateTextFields(items) {}

  static aggregateNumberFields(items) {}

  static aggregateBooleanFields(items) {}

  static aggregateLinksFields(items) {}
}
