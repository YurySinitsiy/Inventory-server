import express from 'express';
import cors from 'cors';

import prisma from './prismaClient.js';
import { supabase } from './src/supabaseClient.js';
import uploadRoutes from './src/upload.js';

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

app.use('/api/upload', uploadRoutes);

app.post('/api/users', (req, res) => {
  const user = 'hello world';

  res.json({
    user,
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'Server is working!' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API response' });
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

app.post('/api/inventories', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not token' });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ error: 'User not found' });

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
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/my-inventories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user)
      return res.status(401).json({ message: 'Invalid token' });
    const inventories = await prisma.inventory.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//Publick inventories
app.get('/api/all-inventories', async (req, res) => {
  try {
    const publicInventories = await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(publicInventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/inventories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/public-inventories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user)
      return res.status(401).json({ message: 'Invalid token' });
    const inventories = await prisma.inventory.findMany({
      where: {
        isPublic: true,
        NOT: {
          ownerId: user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/all-access-write-inventories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user)
      return res.status(401).json({ message: 'Invalid token' });

    const inventories = await prisma.inventory.findMany({
      where: {
        users: {
          some: {
            userId: user.id, // используем ID из токена
          },
        },
      },
      include: {
        users: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const { query = '' } = req.query;

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive',
        },
      },
      select: { name: true },
      take: 20,
    });

    res.json(tags.map((t) => t.name));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

app.get('/api/category', async (req, res) => {
  try {
    const { query = '' } = req.query;

    const category = await prisma.category.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive',
        },
      },
      select: { name: true },
      take: 40,
    });

    res.json(category.map((t) => t.name));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

app.get('/api/inventories/:id/fields', async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      select: { fields: true, version: true },
    });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.json({
      fields: inventory.fields?.Fields || [],
      version: inventory.version,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/inventories', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ error: 'User not found' });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    await prisma.inventory.deleteMany({
      where: {
        id: { in: ids },
        ownerId: user.id, // защита от удаления чужих данных
      },
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/inventories/:id/users-access', async (req, res) => {
  try {
    const { id: inventoryId } = req.params;

    // Получаем всех пользователей
    const users = await prisma.profiles.findMany();

    // Получаем пользователей, у которых есть доступ к этому инвентарю
    const accessList = await prisma.inventoryUser.findMany({
      where: { inventoryId },
      select: { userId: true },
    });

    const accessSet = new Set(accessList.map((a) => a.userId));

    // Формируем результат с флагом hasAccess
    const usersWithAccess = users.map((user) => ({
      ...user,
      hasAccess: accessSet.has(user.id),
    }));

    res.json(usersWithAccess);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users/:id/users-access/bulk', async (req, res) => {
  try {
    const { id: inventoryId } = req.params;
    const { users } = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'users должен быть массивом' });
    }

    for (const u of users) {
      if (u.hasAccess) {
        // даём доступ: создаём запись, если её нет
        await prisma.inventoryUser.upsert({
          where: { inventoryId_userId: { inventoryId, userId: u.userId } },
          update: {}, // ничего не меняем, если запись есть
          create: { inventoryId, userId: u.userId },
        });
      } else {
        // убираем доступ: удаляем запись
        await prisma.inventoryUser.deleteMany({
          where: { inventoryId, userId: u.userId },
        });
      }
    }

    res.json({ success: true, updated: users.length });
  } catch (err) {
    console.error('Ошибка при обновлении доступа:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновление инвентаря (для автосохранения)
app.put('/api/inventories/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ error: 'User not found' });

    const { id } = req.params;
    const {
      title,
      description,
      category,
      tags,
      imageUrl,
      customIdFormat,
      fields,
      isPublic,
      version, // версия формы для оптимистичной блокировки
    } = req.body;

    const inventory = await prisma.inventory.findUnique({ where: { id } });
    if (!inventory)
      return res.status(404).json({ error: 'Inventory not found' });

    // проверка прав на запись
    const canWrite = await hasWriteAccess(user, inventory);
    if (!canWrite) return res.status(403).json({ error: 'No write access' });

    // оптимистичная блокировка: проверяем версию
    if (version !== inventory.version) {
      return res
        .status(409)
        .json({ error: 'Version conflict', currentVersion: inventory.version });
    }

    // обновление категории, если нужно
    if (category && category !== inventory.category) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: category },
      });
      if (!existingCategory) {
        await prisma.category.create({ data: { name: category } });
      }
    }

    // обработка тегов
    const tagRecords = [];
    for (const tagName of tags || []) {
      let tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (!tag) tag = await prisma.tag.create({ data: { name: tagName } });
      tagRecords.push({ tagId: tag.id });
    }

    // обновляем инвентарь
    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        title,
        description,
        category,
        imageUrl,
        customIdFormat,
        fields,
        isPublic,
        version: { increment: 1 }, // увеличиваем версию
        InventoryTag: {
          deleteMany: {}, // удаляем старые теги
          create: tagRecords, // создаем новые
        },
      },
      include: { InventoryTag: { include: { Tag: true } } }, // возвращаем теги
    });

    res.json(updatedInventory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удаление пользователя (профиль + Supabase Auth)
app.delete('/api/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ error: 'User not found' });

    const { ids } = req.params;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    //Удаляем профиль из Prisma
    const deletedProfile = await prisma.profiles.delete({
      where: { ids },
    });

    // Удаляем пользователя из Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error('Supabase Auth delete error:', error);
      return res.status(500).json({ error: 'Failed to delete user from Auth' });
    }

    res.json({ message: 'User deleted successfully', profile: deletedProfile });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found in database' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log('DATABASE_URL =', process.env.DATABASE_URL);
export default app;
