import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { updateSettingsValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettingsValidation, updateSettings);

export default router;
