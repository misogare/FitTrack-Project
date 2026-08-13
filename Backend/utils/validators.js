import { body } from 'express-validator';

export const registerValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('date_of_birth').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
  body('height_cm').optional().isFloat({ min: 0, max: 300 }).withMessage('Height must be between 0-300 cm')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const workoutValidation = [
  body('workout_type').trim().notEmpty().isLength({ max: 50 }),
  body('duration_minutes').isInt({ min: 1, max: 1440 }),
  body('intensity').isIn(['Low', 'Medium', 'High']),
  body('calories_burned').optional().isInt({ min: 0 }),
  body('workout_date').isISO8601(),
  body('notes').optional().isLength({ max: 255 })
];

export const mealValidation = [
  body('meal_type').isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack']),
  body('food_name').trim().notEmpty().isLength({ max: 100 }),
  body('calories').isInt({ min: 0 }),
  body('protein_g').optional().isFloat({ min: 0 }),
  body('carbs_g').optional().isFloat({ min: 0 }),
  body('fat_g').optional().isFloat({ min: 0 }),
  body('meal_date').isISO8601()
];

export const goalValidation = [
  body('goal_type').trim().notEmpty().isLength({ max: 50 }),
  body('target_value').isFloat({ min: 0 }),
  body('start_date').isISO8601(),
  body('target_date').isISO8601(),
  body('status').optional().isIn(['Active', 'Achieved', 'Abandoned'])
];

export const goalProgressValidation = [
  body('goal_id').isInt(),
  body('log_date').isISO8601(),
  body('value').isFloat()
];