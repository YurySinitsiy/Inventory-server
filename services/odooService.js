import crypto from 'crypto';
import prisma from '../lib/prismaClient.js';
import _ from 'lodash';

export class OdooService {
  /**
   * @param {string} profileId
   * @returns {Promise<string|null>}
   */
  static async getToken(profileId) {
    const odooData = await prisma.odoo.findUnique({
      where: { profileId },
    });
    if (!odooData) return null;
    return odooData.apiToken;
  }

  /**
   * @param {string} profileId
   * @returns {Promise<string>}
   */
  static async createToken(profileId) {
    const token = crypto.randomBytes(32).toString('hex');

    const odooData = await prisma.odoo.upsert({
      where: { profileId },
      update: { apiToken: token },
      create: { profileId, apiToken: token },
    });

    return odooData.apiToken;
  }

  /**
   * @param {string} token
   * @returns {Promise<Array<Object>>}
   */
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

  /**
   * @param {string} token
   * @returns {Promise<Object>}
   */
  static async getUserByToken(token) {
    const user = await prisma.odoo.findUnique({
      where: { apiToken: token },
      include: { profile: true },
    });

    if (!user) throw new Error('Invalid API token');
    return user;
  }

  /**
   * @param {string} profileId
   * @returns {Promise<Array<Object>>}
   */
  static async getUserInventories(profileId) {
    return await prisma.inventory.findMany({
      where: { ownerId: profileId },
      include: { items: true, fieldConfigs: true },
    });
  }

  /**
   * @param {Object} inventory
   * @returns {Array<Object>}
   */
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
      ...this.aggregateText(slots, inventory, 'text'),
      ...this.aggregateText(slots, inventory, 'link'),
      ...this.aggregateNumber(slots, inventory),
      ...this.aggregateBoolean(slots, inventory),
    ];
  }

  /**
   * @param {Object} slots
   * @param {Object} inventory
   * @param {string} fieldType
   * @param {Function} handler
   * @returns {Array<Object>}
   */
  static aggregateByType(slots, inventory, fieldType, handler) {
    return inventory.fieldConfigs
      .filter((f) => slots[fieldType].includes(f.slot))
      .map((f) => {
        const values = inventory.items
          .map((item) => item[f.slot])
          .filter((v) => v != null && v !== '');
        if (!values.length) return null;
        return handler(f, values, fieldType);
      })
      .filter(Boolean);
  }

  /**
   * @param {Object} slots
   * @param {Object} inventory
   * @param {'text'|'link'} fieldType
   * @returns {Array<Object>}
   */
  static aggregateText(slots, inventory, fieldType) {
    return this.aggregateByType(
      slots,
      inventory,
      fieldType,
      (f, values, type) => {
        const top_answers = _(values)
          .countBy()
          .map((count, value) => ({ value, count }))
          .orderBy('count', 'desc')
          .take(5)
          .value();

        return {
          text: f.title,
          type,
          count: values.length,
          top_answers,
        };
      }
    );
  }

  /**
   * @param {Object} slots
   * @param {Object} inventory
   * @returns {Array<Object>}
   */
  static aggregateNumber(slots, inventory) {
    return this.aggregateByType(slots, inventory, 'number', (f, values) => {
      const numeric = values.filter((v) => typeof v === 'number');
      if (!numeric.length) return null;

      return {
        text: f.title,
        type: 'number',
        count: numeric.length,
        min: _.min(numeric),
        max: _.max(numeric),
        average: _.round(_.mean(numeric), 2),
      };
    });
  }

  /**
   * @param {Object} slots
   * @param {Object} inventory
   * @returns {Array<Object>}
   */
  static aggregateBoolean(slots, inventory) {
    return this.aggregateByType(slots, inventory, 'boolean', (f, values) => {
      const bools = values.filter((v) => typeof v === 'boolean');
      if (!bools.length) return null;

      const counts = _.countBy(bools);
      return {
        text: f.title,
        type: 'boolean',
        count: bools.length,
        counts,
      };
    });
  }
}
