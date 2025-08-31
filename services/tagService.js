import prisma from '../lib/prismaClient.js';

export class TagService {
  /**
   * @param {string[]} tagNames
   * @returns {Promise<Array>}
   */
  static async createOrGetTags(tagNames) {
    if (!tagNames || tagNames.length === 0) return [];

    const existingTags = await prisma.tag.findMany({
      where: {
        name: { in: tagNames }
      },
      select: { id: true, name: true }
    });

    const existingTagsMap = new Map(
      existingTags.map(tag => [tag.name, tag.id])
    );

    const newTagNames = tagNames.filter(name => !existingTagsMap.has(name));

    let newTags = [];
    if (newTagNames.length > 0) {
      await prisma.tag.createMany({
        data: newTagNames.map(name => ({
          name,
          updatedAt: new Date()
        })),
        skipDuplicates: true
      });

      newTags = await prisma.tag.findMany({
        where: {
          name: { in: newTagNames }
        },
        select: { id: true, name: true }
      });
    }

    const allTags = [...existingTags, ...newTags];
    return allTags.map(tag => ({ tagId: tag.id }));
  }

  /**
   * @param {string[]} tagNames
   * @returns {Promise<Array>}
   */
  static async upsertTags(tagNames) {
    return await Promise.all(
      tagNames.map(async (tagName) => {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        return { tagId: tag.id };
      })
    );
  }

  /**
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<string[]>}
   */
  static async searchTags(query = '', limit = 20) {
    const tags = await prisma.tag.findMany({
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

    return tags.map((t) => t.name);
  }
}
