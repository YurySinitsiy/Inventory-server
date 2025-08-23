import express from "express";
import cors from "cors";
import prisma from "./prismaClient.js";
import { supabase } from "./src/supabaseClient.js";
import uploadRoutes from "./src/upload.js";
const app = express();

// app.use(
// 	cors({
// 		origin: "https://inventory-client-lac.vercel.app",
// 		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// 		allowedHeaders: ["Content-Type", "Authorization"],
// 	})
// );
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);

app.post("/api/users", (req, res) => {
	const user = "hello world";

	res.json({
		user,
	});
});

app.get("/", (req, res) => {
	res.json({ status: "Server is working!" });
});

app.get("/api", (req, res) => {
	res.json({ message: "API response" });
});

async function hasWriteAccess(user, inventory) {
	if (user.id === inventory.ownerId) return true;
	if (inventory.isPublic) return true;
	const access = await prisma.inventoryUser.findUnique({
		where: {
			inventoryId_userId: { inventoryId: inventory.id, userId: user.id },
		},
	});
	return !!access;
	// TODO: Добавить проверку admin роли, если хранится в Supabase metadata
}

app.post("/api/inventories", async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ error: "Not token" });

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);
		if (userError || !user)
			return res.status(401).json({ error: "User not found" });

		const {
			title,
			description,
			category,
			tags,
			imageUrl,
			ownerId,
			customIdFormat,
			fields,
			isPublic,
		} = req.body;

		let categoryName = category || null;
		if (categoryName) {
			const currentCategory = await prisma.category.findUnique({
				where: { name: categoryName },
			});

			if (!currentCategory) {
				await prisma.category.create({ data: { name: categoryName } });
			}
		}

		// 2. Теги (получаем или создаём)
		const tagRecords = [];
		for (const tagName of tags) {
			let tag = await prisma.tag.findUnique({
				where: { name: tagName },
			});

			if (!tag) {
				tag = await prisma.tag.create({
					data: { name: tagName, updatedAt: new Date() },
				});
			}

			tagRecords.push({ tagId: tag.id });
		}

		const inventory = await prisma.inventory.create({
			data: {
				title,
				description,
				category,
				imageUrl,
				ownerId,
				fields,
				customIdFormat,
				isPublic,
				InventoryTag: {
					create: tagRecords, // связь
				},
			},
			include: {
				InventoryTag: { include: { Tag: true } }, // вернуть теги вместе
			},
		});

		res.json(inventory);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.get("/api/my-inventories", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

		const token = authHeader.split(" ")[1];
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);
		if (error || !user)
			return res.status(401).json({ message: "Invalid token" });
		const inventories = await prisma.inventory.findMany({
			where: { ownerId: user.id },
			orderBy: { createdAt: "desc" },
		});
		res.json(inventories);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.delete("/api/inventories", async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ error: "No token" });

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);
		if (userError || !user)
			return res.status(401).json({ error: "User not found" });

		const { ids } = req.body;
		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({ error: "No IDs provided" });
		}

		await prisma.inventory.deleteMany({
			where: {
				id: { in: ids },
				ownerId: user.id, // защита от удаления чужих данных
			},
		});

		res.json({ message: "Deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

//Publick inventories
app.get("/api/all-inventories", async (req, res) => {
	try {
		const publicInventories = await prisma.inventory.findMany({
			orderBy: { createdAt: "desc" },
		});
		res.json(publicInventories);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.get("/api/inventories/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const inventory = await prisma.inventory.findUnique({
			where: { id },
		});

		res.json(inventory);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.get("/api/tags", async (req, res) => {
	try {
		const { query = "" } = req.query;

		const tags = await prisma.tag.findMany({
			where: {
				name: {
					startsWith: query,
					mode: "insensitive",
				},
			},
			select: { name: true },
			take: 20,
		});

		res.json(tags.map((t) => t.name));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch tags" });
	}
});

app.get("/api/category", async (req, res) => {
	try {
		const { query = "" } = req.query;

		const category = await prisma.category.findMany({
			where: {
				name: {
					startsWith: query,
					mode: "insensitive",
				},
			},
			select: { name: true },
			take: 40,
		});

		res.json(category.map((t) => t.name));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch category" });
	}
});

app.get("/api/inventories/:id/fields", async (req, res) => {
	try {
		const { id } = req.params;
		const inventory = await prisma.inventory.findUnique({
			where: { id },
			select: { fields: true, version: true },
		});
		if (!inventory) {
			return res.status(404).json({ message: "Inventory not found" });
		}
		res.json({
			fields: inventory.fields?.Fields || [],
			version: inventory.version,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});

app.patch("/api/inventories/:id/fields", async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "Токен не предоставлен" });
		}

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);
		if (userError || !user) {
			return res.status(401).json({ message: "Пользователь не авторизован" });
		}

		const { id } = req.params;
		const { fields, version } = req.body;

		const inventory = await prisma.inventory.findUnique({
			where: { id },
			select: { ownerId: true, isPublic: true, version: true, fields: true },
		});
		if (!inventory) {
			return res.status(404).json({ message: "Инвентарь не найден" });
		}
		if (!(await hasWriteAccess(user, inventory))) {
			return res.status(403).json({ message: "Доступ запрещён" });
		}
		if (inventory.version !== version) {
			return res.status(409).json({
				message: "Конфликт данных: версия устарела, данные обновлены",
				action: "refresh",
				fields: inventory.fields?.fields || [],
				version: inventory.version,
			});
		}

		const updated = await prisma.inventory.update({
			where: { id },
			data: { fields: { fields }, version: { increment: 1 } },
			select: { fields: true, version: true },
		});

		res.json({ fields: updated.fields, version: updated.version });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Ошибка сервера" });
	}
});

// Удаление пользователя (профиль + Supabase Auth)
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Удаляем профиль из Prisma
    const deletedProfile = await prisma.profiles.delete({
      where: { id },
    });

    // Удаляем пользователя из Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error("Supabase Auth delete error:", error);
      return res.status(500).json({ error: "Failed to delete user from Auth" });
    }

    res.json({ message: "User deleted successfully", profile: deletedProfile });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found in database" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
console.log("DATABASE_URL =", process.env.DATABASE_URL);
export default app;
