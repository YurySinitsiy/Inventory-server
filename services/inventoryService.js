import prisma from '../lib/prismaClient.js';
import { TagService } from './tagService.js';
import { CategoryService } from './categoryService.js';
import { hasWriteAccess } from '../utils/permissions.js';

export class InventoryService {
  /**
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async createInventory(data) {
    const {
      title,
      description,
      category,
      tags = [],
      imageUrl,
      ownerId,
      customIdFormat,
      isPublic,
    } = data;

    await CategoryService.createIfNotExists(category);

    const tagRecords = await TagService.createOrGetTags(tags);

    const inventory = await prisma.inventory.create({
      data: {
        title,
        description,
        category,
        imageUrl,
        ownerId,
        customIdFormat,
        isPublic,
        InventoryTag: {
          create: tagRecords,
        },
      },
      include: {
        InventoryTag: { include: { Tag: true } },
      },
    });

    return inventory;
  }

  /**
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getUserInventories(userId) {
    return await prisma.inventory.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        isPublic: true,
        customIdFormat: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        InventoryTag: {
          select: {
            Tag: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getUserAccessInventories(userId) {
    return await prisma.inventory.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        isPublic: true,
        customIdFormat: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        ownerId: true,
        users: {
          select: {
            userId: true,
          },
        },
        InventoryTag: {
          select: {
            Tag: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @returns {Promise<Array>}
   */
  static async getAllInventories() {
    return await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getPublicInventories(userId) {
    return await prisma.inventory.findMany({
      where: {
        isPublic: true,
        NOT: {
          ownerId: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getInventoryById(id) {
    return await prisma.inventory.findUnique({
      where: { id },
      include: {
        fieldConfigs: true,
        InventoryTag: { include: { Tag: true } },
        users: true,
        owner: true,
      },
    });
  }

  /**
   * @param {string[]} ids
   * @returns {Promise<void>}
   */
  static async deleteInventories(ids) {
    await prisma.inventory.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * @param {string} id
   * @param {Object} user
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async updateInventory(id, user, data) {
    const {
      title,
      description,
      imageUrl,
      isPublic,
      category,
      tags = [],
      customIdFormat,
      fields = [],
      version,
    } = data;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { fieldConfigs: true },
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const canWrite = await hasWriteAccess(user, inventory);
    if (!canWrite) {
      throw new Error('No write access');
    }

    if (version !== inventory.version) {
      throw new Error('Version conflict', {
        currentVersion: inventory.version,
      });
    }

    return await prisma.$transaction(async (tx) => {
      if (category && category !== inventory.category) {
        await tx.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
        });
      }

      const tagRecords = await TagService.upsertTags(tags);

      await tx.inventory.update({
        where: { id },
        data: {
          title,
          description,
          imageUrl,
          isPublic,
          category,
          customIdFormat,
          version: { increment: 1 },
          InventoryTag: {
            deleteMany: {},
            create: tagRecords,
          },
        },
      });

      await this.syncCustomFieldsInTransaction(tx, inventory, fields);

      return await tx.inventory.findUnique({
        where: { id },
        include: {
          fieldConfigs: true,
          InventoryTag: { include: { Tag: true } },
        },
      });
    });
  }

  /**
   * @param {Object} tx
   * @param {Object} inventory
   * @param {Array} fields
   * @returns {Promise<void>}
   */
  static async syncCustomFieldsInTransaction(tx, inventory, fields) {
    const existingSlots = inventory.fieldConfigs.map((f) => f.slot);
    const incomingSlots = fields.map((f) => f.slot);

    const toDelete = existingSlots.filter((s) => !incomingSlots.includes(s));
    if (toDelete.length) {
      await tx.inventoryFieldConfig.deleteMany({
        where: {
          inventoryId: inventory.id,
          slot: { in: toDelete },
        },
      });
    }

    const updates = fields
      .filter((f) => existingSlots.includes(f.slot))
      .map((f) =>
        tx.inventoryFieldConfig.update({
          where: {
            inventoryId_slot: {
              inventoryId: inventory.id,
              slot: f.slot,
            },
          },
          data: {
            title: f.title,
            description: f.description,
            type: f.type,
            visibleInTable: f.visibleInTable,
            position: f.position,
          },
        })
      );

    const newFields = fields
      .filter((f) => !existingSlots.includes(f.slot))
      .map((f) => ({
        inventoryId: inventory.id,
        slot: f.slot,
        title: f.title,
        description: f.description,
        type: f.type,
        visibleInTable: f.visibleInTable,
        position: f.position,
      }));

    await Promise.all([
      ...updates,
      ...(newFields.length
        ? [tx.inventoryFieldConfig.createMany({ data: newFields })]
        : []),
    ]);
  }

  /**
   * @param {Object} inventory
   * @param {Array} fields
   * @returns {Promise<void>}
   */
  static async syncCustomFields(inventory, fields) {
    return await prisma.$transaction(async (tx) => {
      await this.syncCustomFieldsInTransaction(tx, inventory, fields);
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async getInventoryFields(inventoryId) {
    const fields = await prisma.inventoryFieldConfig.findMany({
      where: { inventoryId },
      orderBy: { position: 'asc' }, // сортируем по позиции
    });

    if (!fields) {
      throw new Error('fields not found');
    }

    return fields;
  }

  /**
   * @param {string} inventoryId
   * @param {Object} fieldData
   * @returns {Promise<Object>}
   */
  static async createInventoryField(inventoryId, fieldData) {
    const { name, type, position } = fieldData;

    return await prisma.inventoryField.create({
      data: { name, type, position, inventoryId },
    });
  }

  /**
   * @param {string} inventoryId
   * @param {string} userId
   * @returns {Promise<boolean>}
   */

  static async checkUserWriteAccess(inventoryId, userId) {
    const relation = await prisma.inventoryUser.findUnique({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId,
        },
      },
      select: { inventoryId: true },
    });

    return !!relation;
  }

  /**
   * @param {string} inventoryId
   * @returns {Promise<string>}
   */

  static async getOwner(inventoryId) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        owner: true,
      },
    });
    if (!inventory) return null;
    return inventory.owner;
  }

  /**
   * @param {string} inventoryId
   * @returns {Promise<Array>}
   */

  static async getInventoryTags(inventoryId) {
    const inventoryTags = await prisma.inventoryTag.findMany({
      where: { inventoryId },
    });

    const tagIds = inventoryTags.map((it) => it.tagId);

    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    return tags;
  }

  /**
   * @param {string} inventoryId
   * @param {Object} data
   * @returns {Promise<Object>}
   */

  static async createInventoryItem(inventoryId, data) {
    const itemData = {
      inventoryId,
      customId: data.customId,
      createdBy: data.createdBy,
      text1: data.text1,
      text2: data.text2,
      text3: data.text3,
      multiline1: data.multiline1,
      multiline2: data.multiline2,
      multiline3: data.multiline3,
      number1: data.number1 != null ? parseFloat(data.number1) : null,
      number2: data.number2 != null ? parseFloat(data.number2) : null,
      number3: data.number3 != null ? parseFloat(data.number3) : null,
      link1: data.link1,
      link2: data.link2,
      link3: data.link3,
      boolean1: data.boolean1 != null ? Boolean(data.boolean1) : null,
      boolean2: data.boolean2 != null ? Boolean(data.boolean2) : null,
      boolean3: data.boolean3 != null ? Boolean(data.boolean3) : null,
    };

    const exists = await prisma.item.findFirst({
      where: { inventoryId, customId: data.customId },
    });
    if (exists)
      throw Object.assign(new Error('Custom ID already in use'), {
        status: 400,
      });

    return prisma.item.create({ data: itemData });
  }

  /**
   * @param {string} inventoryId
   * @returns {Promise<Array>}
   */

  static async getInventoryItems(inventoryId) {
    const items = await prisma.item.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }

  /**
   * @param {string[]} ids
   * @returns {Promise<void>}
   */
  static async deleteItems(ids) {
    await prisma.item.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * @param {string} inventoryId
   * @returns {Promise<Array>}
   */

  static async getInventoryCustomIdFormat(inventoryId) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { customIdFormat: true },
    });
    return inventory.customIdFormat;
  }
}
