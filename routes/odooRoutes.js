import { Router } from 'express';
import { OdooController } from '../controllers/odooController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = Router();

router.get('/token/get', checkAuth, OdooController.getToken)
router.post('/token/add', checkAuth, OdooController.createToken);

router.get('/aggregated/get', OdooController.getAggregatedData)

export default router;
