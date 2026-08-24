import { Router } from 'express';
import {
  getBodyMetrics,
  logBodyMetric,
  deleteBodyMetric,
} from '../controllers/bodyMetricController.js';
import { bodyMetricValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getBodyMetrics);
router.post('/', authenticate, bodyMetricValidation, logBodyMetric);
router.delete('/:id', authenticate, deleteBodyMetric);

export default router;
