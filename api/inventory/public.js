import prisma from "../../src/prismaClient.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const publicInventories = await prisma.inventory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(publicInventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
