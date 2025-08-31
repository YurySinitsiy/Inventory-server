import express from 'express';
import cors from 'cors';

import prisma from './lib/prismaClient.js';
import { supabase } from './lib/supabaseClient.js';
import uploadRoutes from './src/upload.js';
import checkAuth from './middleware/checkAuth.js';
import upsertProfile from './services/upsertProfile.js';
import upsertSocialProfile from './services/upsertSocialProfile.js';

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

//!//!//!//!//!//!v//!//!//!//!//!v//!//!//!//!//!//!//!
app.get('/api/my-inventories', checkAuth, async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/all-access-write-inventories', checkAuth, async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: {
        users: {
          some: {
            userId: req.user.id, // используем ID из токена
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

app.get('/api/inventories/:id/users-access', checkAuth, async (req, res) => {
  try {
    const { id: inventoryId } = req.params;

    // Получаем всех пользователей
    const users = await prisma.profiles.findMany({
      where: {
        NOT: {
          id: req.user.id,
        },
      },
    });

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

app.get('/api/me', checkAuth, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      role: req.profile.role,
      status: req.profile.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/auth/social-login', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user?.id) return res.status(400).json({ error: 'User data required' });
    const profile = await upsertSocialProfile(user);
    res.json(profile);
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ error: 'Auth error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { userId, data } = req.body;
    const profile = await upsertProfile(userId, data);
    res.json(profile);
  } catch (error) {
    console.error('Registration:', error);
    res.status(500).json({ error: 'Auth error' });
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

app.get('/api/public-inventories', checkAuth, async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: {
        isPublic: true,
        NOT: {
          ownerId: req.user.id,
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

app.delete('/api/inventories', checkAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    await prisma.inventory.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//*Все пользователи
app.get('/api/users', checkAuth, async (req, res) => {
  try {
    const users = await prisma.profiles.findMany({
      orderBy: { surname: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//*Удаление пользователя
app.delete('/api/users', checkAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    await Promise.all(ids.map((id) => supabase.auth.admin.deleteUser(id)));

    await prisma.profiles.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//*Статус и роль пользователя
app.patch('/api/users/update', checkAuth, async (req, res) => {
  try {
    const { ids, status, role } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const data = {};
    if (status) data.status = status;
    if (role) data.role = role;

    await prisma.profiles.updateMany({
      where: { id: { in: ids } },
      data,
    });

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
//!//!//!//!//!//!v//!//!//!//!//!v//!//!//!//!//!//!//!

//*Добавить поле
app.post('/api/inventories/:id/fields', checkAuth, async (req, res) => {
  const { id: inventoryId } = req.params;
  const { name, type, position } = req.body;

  try {
    const field = await prisma.inventoryField.create({
      data: { name, type, position, inventoryId },
    });

    res.json(field);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Create field error' });
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

//? ПЕРЕДЕЛАТЬ - УБРАТЬ ЦИКЛ
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
//?

// Обновление инвентаря (для автосохранения)
app.put('/api/inventories/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const {
      title,
      description,
      imageUrl,
      isPublic,
      category,
      tags = [],
      customIdFormat,
      fields = [],
      version,
    } = req.body;

    // Найти инвентарь
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { fieldConfigs: true },
    });
    if (!inventory)
      return res.status(404).json({ error: 'Inventory not found' });

    // Проверка прав
    const canWrite = await hasWriteAccess(user, inventory);
    if (!canWrite) return res.status(403).json({ error: 'No write access' });

    // Проверка версии (optimistic lock)
    if (version !== inventory.version) {
      return res.status(409).json({
        error: 'Version conflict',
        currentVersion: inventory.version,
      });
    }

    // Категория
    if (category && category !== inventory.category) {
      await prisma.category.upsert({
        where: { name: category },
        update: {},
        create: { name: category },
      });
    }

    // Теги
    const tagRecords = await Promise.all(
      tags.map(async (tagName) => {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        return { tagId: tag.id };
      })
    );

    // Обновление inventory
    await prisma.inventory.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        isPublic,
        category,
        customIdFormat,
        version: { increment: 1 },
        InventoryTag: {
          deleteMany: {},
          create: tagRecords,
        },
      },
    });

    // Синхронизация кастомных полей
    const existingIds = inventory.fieldConfigs.map((f) => f.id);
    const incomingIds = fields.map((f) => f.id).filter(Boolean);

    // Удаление удалённых полей
    const toDelete = existingIds.filter((fid) => !incomingIds.includes(fid));
    if (toDelete.length > 0) {
      await prisma.inventoryFieldConfig.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    // Обновление существующих полей
    const updates = fields
      .filter((f) => f.id && existingIds.includes(f.id))
      .map((f) =>
        prisma.inventoryFieldConfig.update({
          where: { id: f.id },
          data: {
            title: f.title,
            description: f.description,
            type: f.type,
            visibleInTable: f.visibleInTable,
            position: f.order,
          },
        })
      );

    // Создание новых полей
    const newFields = fields
      .filter((f) => !f.id)
      .map((f) => ({
        id: crypto.randomUUID(),
        inventoryId: id,
        slot: f.slot,
        title: f.title,
        description: f.description,
        type: f.type,
        visibleInTable: f.visibleInTable,
        position: f.order,
      }));

    await prisma.$transaction([
      ...updates,
      ...(newFields.length
        ? [prisma.inventoryFieldConfig.createMany({ data: newFields })]
        : []),
    ]);

    // Вернуть обновлённый объект с полями и тегами
    const fullInventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        fieldConfigs: true,
        InventoryTag: { include: { Tag: true } },
      },
    });

    res.json(fullInventory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log('DATABASE_URL =', process.env.DATABASE_URL);
export default app;
