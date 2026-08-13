import { Router } from 'express';
import { createMeal, getMeals, deleteMeal } from '../controllers/mealController.js';
import { mealValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, mealValidation, createMeal);
router.get('/', authenticate, getMeals);
router.delete('/:id', authenticate, deleteMeal);

export default router;
