import { Router } from 'express';
import { SupportController } from '../controllers/supportController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = Router();


router.post('/send', checkAuth, SupportController.sendMessage);


export default router;
