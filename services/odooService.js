import crypto from 'crypto';
import prisma from '../lib/prismaClient.js';
import { text } from 'stream/consumers';

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
      questions: this.aggregateQuestions(inv),
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

  static aggregateQuestions(inv) {
    return [
      ...this.aggregateTextFields(inv),
      // ...this.aggregateNumberFields(items),
      // ...this.aggregateBooleanFields(items),
      // ...this.aggregateLinksFields(items),
    ];
  }

  static aggregateTextFields(inventory) {
    // 1. Список текстовых слотов
    const textSlots = [
      'text1',
      'text2',
      'text3',
      'multiline1',
      'multiline2',
      'multiline3',
    ];

    // 2. Берём только текстовые поля из fieldConfigs
    const textFields = inventory.fieldConfigs
      .filter((f) => textSlots.includes(f.slot))
      .map((f) => ({ slot: f.slot, title: f.title }));

    // 3. Агрегируем значения
    const aggregated = textFields
      .map((field) => {
        // Берём все значения этого поля из items
        const values = inventory.items
          .map((item) => item[field.slot])
          .filter((v) => v != null && v !== '');

        if (!values.length) return null;

        // Считаем количество повторений
        const counts = {};
        values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));

        // Формируем топ-5 ответов
        const top_answers = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));

        return {
          text: field.title,
          type: 'text',
          count: values.length,
          top_answers,
        };
      })
      .filter(Boolean); // убираем пустые

    return aggregated;
  }

  static aggregateNumberFields(inventory) {}

  static aggregateBooleanFields(inventory) {}

  static aggregateLinksFields(inventory) {}
}
