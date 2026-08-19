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
  body('activity_name')
    .trim()
    .notEmpty()
    .withMessage('Activity name is required')
    .isLength({ max: 100 })
    .withMessage('Activity name must be 100 characters or less'),

  body('workout_type')
    .trim()
    .notEmpty()
    .withMessage('Activity type is required'),

  body('duration_minutes')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),

  body('intensity')
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid intensity'),

  body('workout_date')
    .isISO8601()
    .withMessage('Valid workout date is required'),

  body('calories_burned')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Calories must be a positive number'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes must be 255 characters or less'),

  body('plan_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }),

  body('plan_item_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
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