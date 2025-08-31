import prisma from '../lib/prismaClient.js';
import { supabase } from '../lib/supabaseClient.js';

export class UserManagementService {
  /**
   * @returns {Promise<Array>}
   */
  static async getAllUsers() {
    return await prisma.profiles.findMany({
      orderBy: { surname: 'desc' },
    });
  }

  /**
   * @param {string[]} ids
   * @returns {Promise<void>}
   */
  static async deleteUsers(ids) {
    await Promise.all(ids.map((id) => supabase.auth.admin.deleteUser(id)));

    await prisma.profiles.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * @param {string[]} ids
   * @param {string} status
   * @param {string} role
   * @returns {Promise<void>}
   */
  static async updateUsersStatusAndRole(ids, status, role) {
    const data = {};
    if (status) data.status = status;
    if (role) data.role = role;

    await prisma.profiles.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  /**
   * @param {string} inventoryId
   * @param {string} currentUserId
   * @returns {Promise<Array>}
   */
  static async getUsersWithInventoryAccess(inventoryId, currentUserId) {
    const users = await prisma.profiles.findMany({
      where: {
        NOT: {
          id: currentUserId,
        },
      },
    });
    const accessList = await prisma.inventoryUser.findMany({
      where: { inventoryId },
      select: { userId: true },
    });

    const accessSet = new Set(accessList.map((a) => a.userId));

    return users.map((user) => ({
      ...user,
      hasAccess: accessSet.has(user.id),
    }));
  }

  /**
   * @param {string} inventoryId
   * @param {Array} users
   * @returns {Promise<void>}
   */
  static async bulkUpdateInventoryAccess(inventoryId, users) {
    const usersToGiveAccess = users
      .filter(u => u.hasAccess)
      .map(u => ({ inventoryId, userId: u.userId }));
    
    const usersToRemoveAccess = users
      .filter(u => !u.hasAccess)
      .map(u => u.userId);

    await prisma.$transaction(async (tx) => {
      if (usersToRemoveAccess.length > 0) {
        await tx.inventoryUser.deleteMany({
          where: {
            inventoryId,
            userId: { in: usersToRemoveAccess }
          }
        });
      }

      if (usersToGiveAccess.length > 0) {
        await tx.inventoryUser.createMany({
          data: usersToGiveAccess,
          skipDuplicates: true
        });
      }
    });
  }
}
