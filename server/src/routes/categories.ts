import { Router } from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .delete(deleteCategory);

export default router;
