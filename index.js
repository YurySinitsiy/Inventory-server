import express from "express";
import cors from "cors";
import prisma from "./src/prismaClient.js";
import { supabase } from "./src/supabaseClient.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
//app.use(cors());
app.use(express.json());

// app.post("/api/users", (req, res) => {
// 	const user = "hello world";

// 	res.json({
// 		user,
// 	});
// });

app.get("/", (req, res) => {
	res.json({ status: "Server is working!" });
});

app.get("/api", (req, res) => {
	res.json({ message: "API response" });
});

app.post("/api/inventory", async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ error: "Not token" });

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);
		if (userError || !user)
			return res.status(401).json({ error: "User not found" });

		const { title, description, category = "default" } = req.body;

		const inventory = await prisma.inventory.create({
			data: {
				title,
				description,
				category,
				ownerId: user.id,
				fields: req.body.fields,
				customIdFormat: req.body.customIdFormat,
				isPublic: req.body.isPublic,
			},
		});

		res.json(inventory);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.get("/api/inventory", async (req, res) => {
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

app.delete("/api/inventory", async (req, res) => {
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
app.get("/api/inventory/public", async (req, res) => {
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

app.get("/api/inventory/:id", async (req, res) => {
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

// const PORT = 3001;
// app.listen(PORT, () => {
// 	console.log(`Server running on port ${PORT}`);
// });

export default app;
