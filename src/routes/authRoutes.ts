import { Router } from 'express';
import { login } from '../controllers/authController';
import { createUser } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/register', createUser);

export default router;