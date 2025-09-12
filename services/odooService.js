import crypto from 'crypto';
import prisma from '../lib/prismaClient.js';
import _ from 'lodash';

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

    return userInventories.map((inv) => ({
      templateId: inv.id,
      title: inv.title,
      author: `${user.profile.name} ${user.profile.surname}`,
      questions: this.aggregateFields(inv),
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
      include: { items: true, fieldConfigs: true },
    });
  }

  static aggregateFields(inventory) {
    const slots = {
      text: [
        'text1',
        'text2',
        'text3',
        'multiline1',
        'multiline2',
        'multiline3',
      ],
      number: ['number1', 'number2', 'number3'],
      boolean: ['boolean1', 'boolean2', 'boolean3'],
      link: ['link1', 'link2', 'link3'],
    };

    return [
      ...this.aggregateTextLink(slots, inventory, 'text'),
      ...this.aggregateTextLink(slots, inventory, 'link'),
      ...this.aggregateNumber(slots, inventory),
      ...this.aggregateBoolean(slots, inventory),
    ];
  }

  static aggregateTextLink = (slots, inventory, fieldType) => {
    return inventory.fieldConfigs
      .filter((f) => slots[fieldType].includes(f.slot))
      .map((f) => {
        const values = inventory.items
          .map((item) => item[f.slot])
          .filter((v) => v != null && v !== '');
        if (!values.length) return null;

        const top_answers = _(values)
          .countBy()
          .map((count, value) => ({ value, count }))
          .orderBy('count', 'desc')
          .take(5)
          .value();

        return {
          text: f.title,
          type: fieldType,
          count: values.length,
          top_answers,
        };
      })
      .filter(Boolean);
  };

  static aggregateNumber = (slots, inventory) => {
    return inventory.fieldConfigs
      .filter((f) => slots.number.includes(f.slot))
      .map((f) => {
        const values = inventory.items
          .map((item) => item[f.slot])
          .filter((v) => typeof v === 'number');
        if (!values.length) return null;

        return {
          text: f.title,
          type: 'number',
          count: values.length,
          min: _.min(values),
          max: _.max(values),
          average: _.round(_.mean(values), 2),
        };
      })
      .filter(Boolean);
  };

  static aggregateBoolean = (slots, inventory) => {
    return inventory.fieldConfigs
      .filter((f) => slots.boolean.includes(f.slot))
      .map((f) => {
        const values = inventory.items
          .map((item) => item[f.slot])
          .filter((v) => typeof v === 'boolean');
        if (!values.length) return null;

        const counts = _.countBy(values);
        return {
          text: f.title,
          type: 'boolean',
          count: values.length,
          counts,
        };
      })
      .filter(Boolean);
  };
}
