import { Router } from 'express';
import {
  getPlans, getActivePlan, getPlan, createPlan,
  activatePlan, updatePlanStatus, deletePlan,
  startWorkout, getPlanStats,
  // Phase 2
  getPlanExercises, addPlanExercise,
  updatePlanExercise, swapPlanExercise, deletePlanExercise,updatePlan
} from '../controllers/planController.js';
import {
  getExercises, getMuscleGroups,
} from '../controllers/exerciseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getPlans);
router.get('/active', authenticate, getActivePlan);
router.post('/', authenticate, createPlan);
router.get('/exercises/library', authenticate, getExercises);
router.get('/exercises/muscle-groups', authenticate, getMuscleGroups);

router.get('/:id', authenticate, getPlan);
router.get('/:id/stats', authenticate, getPlanStats);
router.patch('/:id/activate', authenticate, activatePlan);
router.patch('/:id/status', authenticate, updatePlanStatus);
router.delete('/:id', authenticate, deletePlan);

router.get('/:planItemId/exercises', authenticate, getPlanExercises);
router.post('/:planItemId/exercises', authenticate, addPlanExercise);

router.put('/exercise/:id', authenticate, updatePlanExercise);
router.patch('/exercise/:id/swap', authenticate, swapPlanExercise);
router.delete('/exercise/:id', authenticate, deletePlanExercise);

// Keep start workout last — path is /plans/:planItemId/start
router.post('/:planItemId/start', authenticate, startWorkout);
router.put('/:id', authenticate, updatePlan);
export default router;