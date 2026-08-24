import { Router } from 'express';
import { createGoal, getGoals, addProgress, getGoalProgress, updateGoal, deleteGoal } from '../controllers/goalController.js';
import { goalValidation, goalUpdateValidation, goalProgressValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, goalValidation, createGoal);
router.get('/', authenticate, getGoals);
router.post('/progress', authenticate, goalProgressValidation, addProgress);
router.get('/:id/progress', authenticate, getGoalProgress);
router.put('/:id', authenticate, goalUpdateValidation, updateGoal);
router.delete('/:id', authenticate, deleteGoal);

export default router;
