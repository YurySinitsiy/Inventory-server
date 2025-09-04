import express from 'express';
import cors from 'cors';

import uploadRoutes from './src/upload.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';

const app = express();

app.use(
	cors({
		origin: "https://inventory-client-lac.vercel.app",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);
//app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({ status: 'Server is working!' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API response' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/inventories', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', metadataRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;