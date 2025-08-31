import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = Router();

router.get('/', checkAuth, UserController.getAllUsers);

router.get('/me', checkAuth, UserController.getCurrentUser);

router.delete('/', checkAuth, UserController.deleteUsers);

router.patch('/update', checkAuth, UserController.updateUsersStatusAndRole);

router.get('/:id/users-access', checkAuth, UserController.getUsersWithInventoryAccess);
router.post('/:id/users-access/bulk', UserController.bulkUpdateInventoryAccess);

export default router;
