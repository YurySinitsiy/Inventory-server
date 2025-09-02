import { InventoryService } from '../services/inventoryService.js';

export class InventoryController {
  static async createInventory(req, res) {
    try {
      const inventory = await InventoryService.createInventory(req.body);
      res.json(inventory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getMyInventories(req, res) {
    try {
      const inventories = await InventoryService.getUserInventories(
        req.user.id
      );
      res.json(inventories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getAllAccessWriteInventories(req, res) {
    try {
      const inventories = await InventoryService.getUserAccessInventories(
        req.user.id
      );
      res.json(inventories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getAllInventories(req, res) {
    try {
      const inventories = await InventoryService.getAllInventories();
      res.json(inventories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getPublicInventories(req, res) {
    try {
      const inventories = await InventoryService.getPublicInventories(
        req.user.id
      );
      res.json(inventories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getInventoryById(req, res) {
    try {
      const { id } = req.params;
      const inventory = await InventoryService.getInventoryById(id);
      res.json(inventory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async deleteInventories(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided' });
      }

      await InventoryService.deleteInventories(ids);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const inventory = await InventoryService.updateInventory(
        id,
        req.user,
        req.body
      );
      res.json(inventory);
    } catch (error) {
      console.error(error);

      if (error.message === 'Inventory not found') {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      if (error.message === 'No write access') {
        return res.status(403).json({ error: 'No write access' });
      }

      if (error.message === 'Version conflict') {
        return res.status(409).json({
          error: 'Version conflict',
          currentVersion: error.currentVersion,
        });
      }

      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getInventoryFields(req, res) {
    try {
      const { id } = req.params;
      const result = await InventoryService.getInventoryFields(id);
      res.json(result);
    } catch (error) {
      console.error(error);

      if (error.message === 'Inventory not found') {
        return res.status(404).json({ message: 'Inventory not found' });
      }

      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createInventoryField(req, res) {
    try {
      const { id: inventoryId } = req.params;
      const field = await InventoryService.createInventoryField(
        inventoryId,
        req.body
      );
      res.json(field);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Create field error' });
    }
  }

  static async checkUserWriteAccess(req, res) {
    try {
      const inventoryId = req.params.inventoryId;
      const userId = req.params.userId;
      const relation = await InventoryService.checkUserWriteAccess(
        inventoryId,
        userId
      );
      res.json({ hasAccess: !!relation });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Check user error' });
    }
  }

  static async getOwner(req, res) {
    try {
      const { id } = req.params;
      const owner = await InventoryService.getOwner(id);
      res.json(owner);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Check owner error' });
    }
  }

  static async getInventoryTags(req, res) {
    try {
      const { id } = req.params;
      const tags = await InventoryService.getInventoryTags(id);
      res.json(tags);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Check owner error' });
    }
  }

  static async createInventoryItem(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const item = await InventoryService.createInventoryItem(id, data);
      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Check owner error' });
    }
  }

  static async getInventoryItems(req, res) {
    try {
      const { id } = req.params;
      const items = await InventoryService.getInventoryItems(id);
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getInventoryCustomIdFormat(req, res) {
    try {
      const { id } = req.params;
      const customIdFormat = await InventoryService.getInventoryCustomIdFormat(
        id
      );
      res.json(customIdFormat);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async deleteItems(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided' });
      }
      await InventoryService.deleteItems(ids);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}
