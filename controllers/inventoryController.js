import { InventoryService } from '../services/inventoryService.js';
import { supabase } from '../lib/supabaseClient.js';

export class InventoryController {
  static async createInventory(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Not token' });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);
      if (userError || !user)
        return res.status(401).json({ error: 'User not found' });

      const inventory = await InventoryService.createInventory(req.body);
      res.json(inventory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getMyInventories(req, res) {
    try {
      const inventories = await InventoryService.getUserInventories(req.user.id);
      res.json(inventories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getAllAccessWriteInventories(req, res) {
    try {
      const inventories = await InventoryService.getUserAccessInventories(req.user.id);
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
      const inventories = await InventoryService.getPublicInventories(req.user.id);
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
      const inventory = await InventoryService.updateInventory(id, req.user, req.body);
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
      const field = await InventoryService.createInventoryField(inventoryId, req.body);
      res.json(field);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Create field error' });
    }
  }
}
