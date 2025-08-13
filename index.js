import express from "express";
import cors from "cors";
import prisma from "./src/prismaClient.js";
import { supabase } from "./src/supabaseClient.js";

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
			},
		});

		res.json(inventory);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
});

app.get(`/api/inventory/${user}`, async (req, res) => {});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;
