import prisma from "../src/prismaClient.js";
import Cors from "cors";

const cors = Cors({ origin: "*" });

function runCors(req, res) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result)));
  });
}

export default async function handler(req, res) {
  await runCors(req, res);

  const { id } = req.query; // Vercel автоматически кладёт параметры в req.query

  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) return res.status(404).json({ error: "Not found" });

    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
