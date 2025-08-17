import prisma from "./prismaClient.js";

async function testConnection() {
  try {
    const inventories = await prisma.inventory.findMany({
      take: 1
    });
    console.log("✅ Connection successful, sample inventory:", inventories);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
