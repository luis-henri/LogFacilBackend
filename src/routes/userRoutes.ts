import { Router } from 'express';
import { getAllUsers, updateUser } from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers);
router.patch('/:id', updateUser);

export default router;
