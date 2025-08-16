import prisma from "../../src/prismaClient.js";
import { supabase } from "../../src/supabaseClient.js";

export default async function handler(req, res) {
  const method = req.method;

  // GET /api/inventory
  if (method === "GET") {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

      const token = authHeader.split(" ")[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ message: "Invalid token" });

      const inventories = await prisma.inventory.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(inventories);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // POST /api/inventory
  if (method === "POST") {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "No token" });

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return res.status(401).json({ error: "User not found" });

      const { title, description, category = "default", fields, customIdFormat, isPublic } = req.body;

      const inventory = await prisma.inventory.create({
        data: {
          title, description, category, ownerId: user.id,
          fields, customIdFormat, isPublic,
        },
      });

      return res.status(200).json(inventory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // DELETE /api/inventory
  if (method === "DELETE") {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "No token" });

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return res.status(401).json({ error: "User not found" });

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      await prisma.inventory.deleteMany({
        where: { id: { in: ids }, ownerId: user.id },
      });

      return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end();
}
