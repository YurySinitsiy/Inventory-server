import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

router.put('/social-login', AuthController.socialLogin);

router.post('/signup', AuthController.signup);

export default router;
