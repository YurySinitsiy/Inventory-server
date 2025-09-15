import { Router } from 'express';
import { SalesforceController} from '../controllers/salesforceController.js'
const router = Router()

router.post('/start', SalesforceController.startSalesforce);
router.get('/user/:id', SalesforceController.getSalesforceData)
router.patch('/unlink', SalesforceController.unlinkSalesforce)


export default router