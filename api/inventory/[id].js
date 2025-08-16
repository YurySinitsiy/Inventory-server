import prisma from "../../src/prismaClient.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") return res.status(405).end();

  try {
    const inventory = await prisma.inventory.findUnique({ where: { id } });
    if (!inventory) return res.status(404).json({ error: "Not found" });
    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
