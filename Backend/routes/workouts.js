import { Router } from 'express';
import { createWorkout, getWorkouts, deleteWorkout, updateWorkout, getDailySummary } from '../controllers/workoutController.js';
import { workoutValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, workoutValidation, createWorkout);

router.get('/', authenticate, getWorkouts);

router.put('/:id', authenticate, workoutValidation, updateWorkout);

router.delete('/:id', authenticate, deleteWorkout);
router.get('/daily-summary', authenticate, getDailySummary); // ← must come before /:id


export default router;
