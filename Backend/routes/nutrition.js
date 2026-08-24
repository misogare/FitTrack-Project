import { Router } from 'express';
import {
  getNutritionGoals,
  updateNutritionGoals,
  getWaterLog,
  logWater,
  deleteWaterLog,
} from '../controllers/nutritionController.js';
import { nutritionGoalValidation, waterLogValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Nutrition goals (stored in SETTINGS)
router.get('/goals', authenticate, getNutritionGoals);
router.put('/goals', authenticate, nutritionGoalValidation, updateNutritionGoals);

// Water / hydration log
router.get('/water', authenticate, getWaterLog);
router.post('/water', authenticate, waterLogValidation, logWater);
router.delete('/water/:id', authenticate, deleteWaterLog);

export default router;
