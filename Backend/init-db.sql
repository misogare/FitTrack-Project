CREATE DATABASE IF NOT EXISTS fittrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fittrack;

-- =========================================================
-- USER
-- =========================================================

CREATE TABLE IF NOT EXISTS USER (
  user_id INT AUTO_INCREMENT PRIMARY KEY,

  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  date_of_birth DATE NULL,
  gender VARCHAR(20) NULL,
  height_cm DECIMAL(5,2) NULL,
  weight_kg DECIMAL(5,2) NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- USER SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS SETTINGS (
  settings_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,

  daily_step_goal INT NOT NULL DEFAULT 10000,
  daily_workout_minutes INT NOT NULL DEFAULT 60,
  daily_calorie_burn_goal INT NOT NULL DEFAULT 500,
  daily_hydration_litres DECIMAL(4,2) NOT NULL DEFAULT 2.50,

  -- Nutrition targets (UC-15)
  daily_calorie_goal INT NOT NULL DEFAULT 2200,
  daily_protein_goal DECIMAL(6,2) NOT NULL DEFAULT 150.00,
  daily_carbs_goal DECIMAL(6,2) NOT NULL DEFAULT 275.00,
  daily_fat_goal DECIMAL(6,2) NOT NULL DEFAULT 73.00,

  research_data_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  email_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  public_profile_visibility BOOLEAN NOT NULL DEFAULT FALSE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- WORKOUT PLANS
-- =========================================================

CREATE TABLE IF NOT EXISTS WORKOUT_PLAN (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NULL,

  plan_name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  difficulty VARCHAR(20) NULL,
  duration_weeks INT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'Active',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- WORKOUT PLAN ITEMS
-- =========================================================

CREATE TABLE IF NOT EXISTS WORKOUT_PLAN_ITEM (
  plan_item_id INT AUTO_INCREMENT PRIMARY KEY,

  plan_id INT NOT NULL,

  activity_name VARCHAR(100) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,

  target_duration_minutes INT NULL,
  target_intensity VARCHAR(20) NULL,

  day_number INT NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (plan_id)
    REFERENCES WORKOUT_PLAN(plan_id)
    ON DELETE CASCADE
);


-- =========================================================
-- WORKOUT / ACTIVITY
-- =========================================================

CREATE TABLE IF NOT EXISTS WORKOUT (
  workout_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,
  plan_id INT NULL,
  plan_item_id INT NULL,

  activity_name VARCHAR(100) NOT NULL,
  workout_type VARCHAR(50) NOT NULL,

  duration_minutes INT NOT NULL,
  intensity VARCHAR(20) NOT NULL,

  calories_burned INT NULL,
  distance_km DECIMAL(6,2) NULL,

  workout_date DATE NOT NULL,

  notes VARCHAR(255) NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE,

  FOREIGN KEY (plan_id)
    REFERENCES WORKOUT_PLAN(plan_id)
    ON DELETE SET NULL,

  FOREIGN KEY (plan_item_id)
    REFERENCES WORKOUT_PLAN_ITEM(plan_item_id)
    ON DELETE SET NULL
);

-- =========================================================
-- EXERCISE LIBRARY
-- =========================================================
CREATE TABLE IF NOT EXISTS EXERCISE (
  exercise_id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,           -- Compound, Isolation, Machine, Bodyweight
  muscle_group VARCHAR(50) NOT NULL,      -- Quads, Hamstrings, Back, Chest, etc.
  equipment VARCHAR(50) NULL,              -- Barbell, Dumbbell, Machine, Bodyweight

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- PLAN EXERCISES (exercises inside a plan item / session)
-- =========================================================
CREATE TABLE IF NOT EXISTS PLAN_EXERCISE (
  plan_exercise_id INT AUTO_INCREMENT PRIMARY KEY,

  plan_item_id INT NOT NULL,
  exercise_id INT NOT NULL,

  sets INT NULL,
  reps VARCHAR(20) NULL,                  -- "8-10", "12 each", "20", "AMRAP"
  weight_kg DECIMAL(6,2) NULL,
  rest_seconds INT NULL,

  sort_order INT NOT NULL DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (plan_item_id)
    REFERENCES WORKOUT_PLAN_ITEM(plan_item_id)
    ON DELETE CASCADE,

  FOREIGN KEY (exercise_id)
    REFERENCES EXERCISE(exercise_id)
    ON DELETE RESTRICT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- =========================================================
-- BODY METRICS (weight / BMI / body fat / measurements)
-- =========================================================

CREATE TABLE IF NOT EXISTS BODY_METRIC (
  body_metric_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,
  log_date DATE NOT NULL,

  weight_kg DECIMAL(5,2) NULL,
  bmi DECIMAL(4,2) NULL,
  body_fat_pct DECIMAL(4,2) NULL,

  chest_cm DECIMAL(5,2) NULL,
  waist_cm DECIMAL(5,2) NULL,
  hips_cm DECIMAL(5,2) NULL,
  arms_cm DECIMAL(5,2) NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_body_metric_user_date (user_id, log_date),

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- MEALS
-- =========================================================

CREATE TABLE IF NOT EXISTS MEAL (
  meal_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  meal_type VARCHAR(20) NOT NULL,
  food_name VARCHAR(100) NOT NULL,

  calories INT NOT NULL,

  protein_g DECIMAL(6,2) NULL,
  carbs_g DECIMAL(6,2) NULL,
  fat_g DECIMAL(6,2) NULL,

  meal_date DATE NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- FOOD DATABASE (UC-14: search + barcode scanning)
-- =========================================================

CREATE TABLE IF NOT EXISTS FOOD (
  food_id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100) NOT NULL,
  barcode VARCHAR(64) NULL UNIQUE,
  category VARCHAR(50) NULL,

  serving_size DECIMAL(8,2) NULL,
  serving_unit VARCHAR(20) NULL,

  calories INT NOT NULL,
  protein_g DECIMAL(6,2) NULL,
  carbs_g DECIMAL(6,2) NULL,
  fat_g DECIMAL(6,2) NULL,

  user_id INT NULL, -- NULL = built-in food; otherwise a user's custom food

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- WATER / HYDRATION LOG
-- =========================================================

CREATE TABLE IF NOT EXISTS WATER_LOG (
  water_log_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  log_date DATE NOT NULL,
  amount_ml INT NOT NULL,

  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- GOALS
-- =========================================================

CREATE TABLE IF NOT EXISTS GOAL (
  goal_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  goal_type VARCHAR(50) NOT NULL,

  target_value DECIMAL(8,2) NOT NULL,
  current_value DECIMAL(8,2) DEFAULT 0,

  start_date DATE NOT NULL,
  target_date DATE NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'Active',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES USER(user_id)
    ON DELETE CASCADE
);


-- =========================================================
-- GOAL PROGRESS
-- =========================================================

CREATE TABLE IF NOT EXISTS GOAL_PROGRESS (
  log_id INT AUTO_INCREMENT PRIMARY KEY,

  goal_id INT NOT NULL,

  log_date DATE NOT NULL,
  value DECIMAL(8,2) NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id)
    REFERENCES GOAL(goal_id)
    ON DELETE CASCADE
);