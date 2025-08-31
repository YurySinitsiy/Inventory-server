import prisma from '../lib/prismaClient.js';

export class CategoryService {
  /**
   * @param {string} categoryName
   * @returns {Promise<void>}
   */
  static async createIfNotExists(categoryName) {
    if (!categoryName) return;
    
    const currentCategory = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!currentCategory) {
      await prisma.category.create({ data: { name: categoryName } });
    }
  }

  /**
   * @param {string} categoryName
   * @returns {Promise<void>}
   */
  static async upsert(categoryName) {
    if (!categoryName) return;
    
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  /**
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<string[]>}
   */
  static async searchCategories(query = '', limit = 40) {
    const categories = await prisma.category.findMany({
      where: query ? {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      } : {},
      select: { name: true },
      take: limit,
      orderBy: { 
        name: 'asc'
      }
    });

    return categories.map((c) => c.name);
  }
}
