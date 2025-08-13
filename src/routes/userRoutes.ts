import { Router } from 'express';
import { getAllUsers, updateUser, getAllPerfis } from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers);
router.patch('/:id', updateUser);
router.get('/perfis', getAllPerfis);

export default router;
