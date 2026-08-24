import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { registerValidation, loginValidation, changePasswordValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

export default router;
