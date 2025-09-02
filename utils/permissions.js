import prisma from '../lib/prismaClient.js';

/**
 * @param {Object} user
 * @param {Object} inventory
 * @returns {boolean}
 */
export async function hasWriteAccess(user, inventory) {
  if (user.id === inventory.ownerId) return true;
  if (inventory.isPublic) return true;
  
  const access = await prisma.inventoryUser.findUnique({
    where: {
      inventoryId_userId: { inventoryId: inventory.id, userId: user.id },
    },
  });
  
  return !!access;
}