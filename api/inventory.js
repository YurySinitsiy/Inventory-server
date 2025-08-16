import prisma from "../src/prismaClient.js";
import { supabase } from "../src/supabaseClient.js";
import Cors from "cors";

// Настройка CORS
const cors = Cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

function runCors(req, res) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runCors(req, res);

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token" });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) return res.status(401).json({ error: "User not found" });

    if (req.method === "POST") {
      const { title, description, category = "default", fields, customIdFormat, isPublic } = req.body;

      const inventory = await prisma.inventory.create({
        data: { title, description, category, ownerId: user.id, fields, customIdFormat, isPublic },
      });

      return res.json(inventory);
    }

    if (req.method === "GET") {
      const inventories = await prisma.inventory.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return res.json(inventories);
    }

    if (req.method === "DELETE") {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      await prisma.inventory.deleteMany({
        where: { id: { in: ids }, ownerId: user.id },
      });

      return res.json({ message: "Deleted successfully" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
