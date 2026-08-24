import { Router } from 'express';
import {
  getFoods,
  getFoodByBarcode,
  createFood,
  deleteFood,
} from '../controllers/foodController.js';
import { foodValidation } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getFoods);
router.get('/barcode/:code', authenticate, getFoodByBarcode);
router.post('/', authenticate, foodValidation, createFood);
router.delete('/:id', authenticate, deleteFood);

export default router;
