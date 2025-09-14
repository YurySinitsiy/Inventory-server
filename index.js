import express from 'express';
import cors from 'cors';
import uploadRoutes from './src/upload.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import salesforceRoutes from './routes/salesforceRoutes.js';
import odooRoutes from './routes/odooRoutes.js';
import supportRoutes from './routes/supportRoutes.js'
const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://my-odoo-app.odoo.com',
        'http://127.0.0.1:5500/index.html',
        'http://localhost:5173',
        'https://inventory-client-lac.vercel.app',
      ];
      if (!origin) return callback(null, true); // для Postman или серверных запросов
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-token'],
  })
);
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
app.use('/api/salesforce', salesforceRoutes);
app.use('/api/odoo', odooRoutes);
app.use('/api/support', supportRoutes);


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
