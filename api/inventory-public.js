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

  try {
    const inventories = await prisma.inventory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
