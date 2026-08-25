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

export const updateProfileValidation = [
  body('first_name').optional().trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('last_name').optional().trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .custom(v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime()))
    .withMessage('Date of birth must be in YYYY-MM-DD format (e.g. 1999-10-10)'),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender'),
  body('height_cm').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Height must be between 0 and 300 cm'),
  body('weight_kg').optional({ nullable: true }).isFloat({ min: 0, max: 500 }).withMessage('Weight must be between 0 and 500 kg'),
  body('fitness_level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid fitness level'),
  body('avatar_style').optional().isLength({ max: 30 })
];

export const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('New password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
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

  body('distance_km')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Distance must be a positive number in km'),

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

export const foodValidation = [
  body('name').trim().notEmpty().withMessage('Food name is required').isLength({ max: 100 }),
  body('barcode').optional({ nullable: true }).trim().isLength({ max: 64 }).withMessage('Barcode is too long'),
  body('category').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('serving_size').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Serving size must be positive'),
  body('serving_unit').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('calories').isInt({ min: 0 }).withMessage('Calories must be a positive number'),
  body('protein_g').optional({ nullable: true }).isFloat({ min: 0 }),
  body('carbs_g').optional({ nullable: true }).isFloat({ min: 0 }),
  body('fat_g').optional({ nullable: true }).isFloat({ min: 0 })
];

export const nutritionGoalValidation = [
  body('calories').optional().isInt({ min: 0, max: 20000 }).withMessage('Calorie goal must be a positive number'),
  body('protein').optional().isFloat({ min: 0, max: 2000 }).withMessage('Protein goal must be a positive number'),
  body('carbs').optional().isFloat({ min: 0, max: 2000 }).withMessage('Carbs goal must be a positive number'),
  body('fat').optional().isFloat({ min: 0, max: 2000 }).withMessage('Fat goal must be a positive number'),
  body('hydration_litres').optional().isFloat({ min: 0, max: 20 }).withMessage('Hydration goal must be a positive number')
];

export const waterLogValidation = [
  body('log_date').isISO8601().withMessage('Valid date is required'),
  body('amount_ml').isInt({ min: 1, max: 10000 }).withMessage('Amount must be between 1 and 10000 ml')
];

export const goalValidation = [
  body('goal_type').trim().notEmpty().isLength({ max: 50 }),
  body('target_value').isFloat({ min: 0 }),
  body('start_value').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Start value must be a positive number'),
  body('start_date').isISO8601(),
  body('target_date').isISO8601(),
  body('status').optional().isIn(['Active', 'Achieved', 'Abandoned'])
];

export const goalUpdateValidation = [
  body('goal_type').optional().trim().notEmpty().isLength({ max: 50 }),
  body('target_value').optional().isFloat({ min: 0 }),
  body('start_value').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Start value must be a positive number'),
  body('current_value').optional().isFloat({ min: 0 }),
  body('start_date').optional().isISO8601(),
  body('target_date').optional().isISO8601(),
  body('status').optional().isIn(['Active', 'Achieved', 'Abandoned'])
];

export const bodyMetricValidation = [
  body('log_date').isISO8601().withMessage('Valid date is required'),
  body('weight_kg').optional({ nullable: true }).isFloat({ min: 20, max: 400 }).withMessage('Weight must be between 20 and 400 kg'),
  body('bmi').optional({ nullable: true }).isFloat({ min: 5, max: 80 }).withMessage('Invalid BMI'),
  body('body_fat_pct').optional({ nullable: true }).isFloat({ min: 1, max: 70 }).withMessage('Body fat must be between 1 and 70 %'),
  body('chest_cm').optional({ nullable: true }).isFloat({ min: 20, max: 300 }).withMessage('Invalid chest measurement'),
  body('waist_cm').optional({ nullable: true }).isFloat({ min: 20, max: 300 }).withMessage('Invalid waist measurement'),
  body('hips_cm').optional({ nullable: true }).isFloat({ min: 20, max: 300 }).withMessage('Invalid hips measurement'),
  body('arms_cm').optional({ nullable: true }).isFloat({ min: 10, max: 200 }).withMessage('Invalid arms measurement')
];

export const goalProgressValidation = [
  body('goal_id').isInt(),
  body('log_date').isISO8601(),
  body('value').isFloat()
];

export const updateSettingsValidation = [
  body('daily_step_goal').optional({ nullable: true }).isInt({ min: 0, max: 100000 }).withMessage('Step goal must be between 0-100000'),
  body('daily_workout_minutes').optional({ nullable: true }).isInt({ min: 0, max: 1440 }).withMessage('Workout minutes goal must be a positive number'),
  body('daily_calorie_burn_goal').optional({ nullable: true }).isInt({ min: 0, max: 20000 }).withMessage('Calorie burn goal must be a positive number'),
  body('daily_hydration_litres').optional({ nullable: true }).isFloat({ min: 0, max: 20 }).withMessage('Hydration goal must be a positive number'),
  body('research_data_sharing').optional().isBoolean(),
  body('email_reminders').optional().isBoolean(),
  body('public_profile_visibility').optional().isBoolean(),
  body('prefs').optional().isObject()
];

export const deleteAccountValidation = [
  body('confirm').equals('DELETE').withMessage('Confirmation is required to delete your account')
];

/* ============================================================
   PLAN VALIDATORS
============================================================ */

export const planValidation = [
  body('plan_name').trim().notEmpty().withMessage('Plan name is required').isLength({ max: 100 }).withMessage('Plan name must be 100 characters or less'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
  body('difficulty').optional({ nullable: true }).isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
  body('duration_weeks').optional({ nullable: true }).isInt({ min: 1, max: 52 }).withMessage('Duration must be between 1 and 52 weeks'),
  body('status').optional().isIn(['Active', 'Paused', 'Draft', 'Completed']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.activity_name').optional().trim().notEmpty().withMessage('Activity name is required').isLength({ max: 100 }),
  body('items.*.activity_type').optional().trim().notEmpty().withMessage('Activity type is required').isLength({ max: 50 }),
  body('items.*.target_duration_minutes').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('items.*.target_intensity').optional({ nullable: true }).isIn(['Low', 'Medium', 'High']).withMessage('Intensity must be Low, Medium, or High'),
  body('items.*.day_number').optional().isInt({ min: 1 }).withMessage('Day number must be at least 1'),
  body('items.*.exercises').optional().isArray().withMessage('Exercises must be an array'),
  body('items.*.exercises.*.name').optional().trim().notEmpty().withMessage('Exercise name is required'),
  body('items.*.exercises.*.sets').optional({ nullable: true }).isInt({ min: 1, max: 100 }).withMessage('Sets must be between 1 and 100'),
  body('items.*.exercises.*.reps').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Reps must be 20 characters or less'),
  body('items.*.exercises.*.weight_kg').optional({ nullable: true }).isFloat({ min: 0, max: 2000 }).withMessage('Weight must be between 0 and 2000 kg'),
  body('items.*.exercises.*.rest_seconds').optional({ nullable: true }).isInt({ min: 0, max: 3600 }).withMessage('Rest must be between 0 and 3600 seconds'),
];

export const planUpdateValidation = [
  body('plan_name').optional().trim().notEmpty().withMessage('Plan name is required').isLength({ max: 100 }).withMessage('Plan name must be 100 characters or less'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
  body('difficulty').optional({ nullable: true }).isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
  body('duration_weeks').optional({ nullable: true }).isInt({ min: 1, max: 52 }).withMessage('Duration must be between 1 and 52 weeks'),
];

export const planStatusValidation = [
  body('status').isIn(['Active', 'Paused', 'Completed', 'Draft']).withMessage('Invalid status'),
];

export const planExerciseValidation = [
  body('exercise_id').isInt({ min: 1 }).withMessage('Exercise ID is required'),
  body('sets').optional({ nullable: true }).isInt({ min: 1, max: 100 }).withMessage('Sets must be between 1 and 100'),
  body('reps').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Reps must be 20 characters or less'),
  body('weight_kg').optional({ nullable: true }).isFloat({ min: 0, max: 2000 }).withMessage('Weight must be between 0 and 2000 kg'),
  body('rest_seconds').optional({ nullable: true }).isInt({ min: 0, max: 3600 }).withMessage('Rest must be between 0 and 3600 seconds'),
];

export const planExerciseUpdateValidation = [
  body('sets').optional({ nullable: true }).isInt({ min: 1, max: 100 }).withMessage('Sets must be between 1 and 100'),
  body('reps').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Reps must be 20 characters or less'),
  body('weight_kg').optional({ nullable: true }).isFloat({ min: 0, max: 2000 }).withMessage('Weight must be between 0 and 2000 kg'),
  body('rest_seconds').optional({ nullable: true }).isInt({ min: 0, max: 3600 }).withMessage('Rest must be between 0 and 3600 seconds'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive number'),
];

export const planExerciseSwapValidation = [
  body('exercise_id').isInt({ min: 1 }).withMessage('Exercise ID is required'),
];

export const startWorkoutValidation = [
  body('notes').optional({ nullable: true }).trim().isLength({ max: 255 }).withMessage('Notes must be 255 characters or less'),
];