import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());



app.post("/api/users", (req, res) => {
	const user = 'hello world'
    
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

export default app;
