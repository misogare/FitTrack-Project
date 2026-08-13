import { Router } from 'express';
import { createWorkout, getWorkouts, deleteWorkout } from '../controllers/workoutController.js';
import { workoutValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, workoutValidation, createWorkout);
router.get('/', authenticate, getWorkouts);
router.delete('/:id', authenticate, deleteWorkout);

export default router;
