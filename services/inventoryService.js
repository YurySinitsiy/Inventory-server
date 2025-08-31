import prisma from '../lib/prismaClient.js';
import { supabase } from '../lib/supabaseClient.js';
import { TagService } from './tagService.js';
import { CategoryService } from './categoryService.js';
import { hasWriteAccess } from '../utils/permissions.js';
import { randomUUID } from 'crypto';

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
              select: { name: true }
            }
          }
        }
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
            userId: true
          }
        },
        InventoryTag: {
          select: {
            Tag: {
              select: { name: true }
            }
          }
        }
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
      throw new Error('Version conflict', { currentVersion: inventory.version });
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
    const existingIds = inventory.fieldConfigs.map((f) => f.id);
    const incomingIds = fields.map((f) => f.id).filter(Boolean);

    const toDelete = existingIds.filter((fid) => !incomingIds.includes(fid));
    if (toDelete.length > 0) {
      await tx.inventoryFieldConfig.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    const updates = fields
      .filter((f) => f.id && existingIds.includes(f.id))
      .map((f) =>
        tx.inventoryFieldConfig.update({
          where: { id: f.id },
          data: {
            title: f.title,
            description: f.description,
            type: f.type,
            visibleInTable: f.visibleInTable,
            position: f.order,
          },
        })
      );

    const newFields = fields
      .filter((f) => !f.id)
      .map((f) => ({
        id: randomUUID(),
        inventoryId: inventory.id,
        slot: f.slot,
        title: f.title,
        description: f.description,
        type: f.type,
        visibleInTable: f.visibleInTable,
        position: f.order,
      }));

    await Promise.all([
      ...updates,
      ...(newFields.length > 0 
        ? [tx.inventoryFieldConfig.createMany({ data: newFields })] 
        : [])
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
  static async getInventoryFields(id) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      select: { fields: true, version: true },
    });
    
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    
    return {
      fields: inventory.fields?.Fields || [],
      version: inventory.version,
    };
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
}
