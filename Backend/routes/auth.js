import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile, changePassword, deleteAccount, deleteAllData } from '../controllers/authController.js';
import { registerValidation, loginValidation, updateProfileValidation, changePasswordValidation, deleteAccountValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);
router.delete('/account', authenticate, deleteAccountValidation, deleteAccount);
router.post('/delete-data', authenticate, deleteAccountValidation, deleteAllData);

export default router;
