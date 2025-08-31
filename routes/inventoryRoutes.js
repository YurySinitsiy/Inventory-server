import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = Router();

router.post('/', InventoryController.createInventory);

router.get('/my', checkAuth, InventoryController.getMyInventories);
router.get('/access-write', checkAuth, InventoryController.getAllAccessWriteInventories);
router.get('/all', InventoryController.getAllInventories);
router.get('/public', checkAuth, InventoryController.getPublicInventories);

router.get('/:id', InventoryController.getInventoryById);
router.put('/:id', checkAuth, InventoryController.updateInventory);

router.get('/:id/fields', InventoryController.getInventoryFields);
router.post('/:id/fields', checkAuth, InventoryController.createInventoryField);

router.delete('/', checkAuth, InventoryController.deleteInventories);

export default router;
