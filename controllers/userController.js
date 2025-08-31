import { UserManagementService } from '../services/userManagementService.js';

export class UserController {
  static async getAllUsers(req, res) {
    try {
      const users = await UserManagementService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async deleteUsers(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided' });
      }

      await UserManagementService.deleteUsers(ids);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async updateUsersStatusAndRole(req, res) {
    try {
      const { ids, status, role } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided' });
      }

      await UserManagementService.updateUsersStatusAndRole(ids, status, role);
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getUsersWithInventoryAccess(req, res) {
    try {
      const { id: inventoryId } = req.params;
      const users = await UserManagementService.getUsersWithInventoryAccess(
        inventoryId,
        req.user.id
      );
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async bulkUpdateInventoryAccess(req, res) {
    try {
      const { id: inventoryId } = req.params;
      const { users } = req.body;

      if (!Array.isArray(users)) {
        return res.status(400).json({ error: 'users must be an array' });
      }

      await UserManagementService.bulkUpdateInventoryAccess(inventoryId, users);
      res.json({ success: true, updated: users.length });
    } catch (error) {
      console.error('Error updating access:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.profile.role,
        status: req.profile.status,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}
