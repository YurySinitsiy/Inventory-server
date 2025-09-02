import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = Router();

router.post('/',checkAuth, InventoryController.createInventory);

router.get('/my', checkAuth, InventoryController.getMyInventories);
router.get('/access-write', checkAuth, InventoryController.getAllAccessWriteInventories);
router.get('/:inventoryId/access-write/user/:userId', checkAuth, InventoryController.checkUserWriteAccess)
router.get('/all', InventoryController.getAllInventories);
router.get('/public', checkAuth, InventoryController.getPublicInventories);

router.get('/:id', InventoryController.getInventoryById);
router.put('/:id', checkAuth, InventoryController.updateInventory);

router.get('/:id/owner', InventoryController.getOwner)

router.get('/:id/tags', InventoryController.getInventoryTags)


router.get('/:id/fields', InventoryController.getInventoryFields);
router.post('/:id/fields', checkAuth, InventoryController.createInventoryField);

router.post('/:id/items', checkAuth, InventoryController.createInventoryItem)
router.get('/:id/items', InventoryController.getInventoryItems)
router.delete('/:id/items', checkAuth, InventoryController.deleteItems)

router.get('/:id/idFormat', InventoryController.getInventoryCustomIdFormat)


router.delete('/', checkAuth, InventoryController.deleteInventories);

export default router;