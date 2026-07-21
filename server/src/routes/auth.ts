import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserAccount);

export default router;
