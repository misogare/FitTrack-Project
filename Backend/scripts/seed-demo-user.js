import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const DEMO = {
  first_name: 'Demo',
  last_name: 'User',
  email: 'demo@fittrack.local',
  password: 'Demo123!',
  date_of_birth: '1998-05-12',
  gender: 'Other',
  height_cm: 175,
};

// Migrations for databases created before nutrition goals / water tracking /
// the food database existed. MySQL DDL auto-commits, so run before the explicit transaction.
async function ensureSchema(connection) {
  const [cols] = await connection.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SETTINGS'`
  );
  const existing = new Set(cols.map(c => c.COLUMN_NAME));
  const goalColumns = {
    daily_calorie_goal: 'INT NOT NULL DEFAULT 2200',
    daily_protein_goal: 'DECIMAL(6,2) NOT NULL DEFAULT 150.00',
    daily_carbs_goal: 'DECIMAL(6,2) NOT NULL DEFAULT 275.00',
    daily_fat_goal: 'DECIMAL(6,2) NOT NULL DEFAULT 73.00',
  };
  for (const [name, definition] of Object.entries(goalColumns)) {
    if (!existing.has(name)) {
      await connection.execute(`ALTER TABLE SETTINGS ADD COLUMN ${name} ${definition}`);
    }
  }
  await connection.execute(
    `CREATE TABLE IF NOT EXISTS WATER_LOG (
       water_log_id INT AUTO_INCREMENT PRIMARY KEY,
       user_id INT NOT NULL,
       log_date DATE NOT NULL,
       amount_ml INT NOT NULL,
       logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
     )`
  );
  await connection.execute(
    `CREATE TABLE IF NOT EXISTS FOOD (
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
       user_id INT NULL,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
     )`
  );
  // distance_km on WORKOUT (Analytics distance KPI)
  const [wcols] = await connection.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WORKOUT'`
  );
  if (!wcols.some(c => c.COLUMN_NAME === 'distance_km')) {
    await connection.execute('ALTER TABLE WORKOUT ADD COLUMN distance_km DECIMAL(6,2) NULL');
  }
  await connection.execute(
    `CREATE TABLE IF NOT EXISTS BODY_METRIC (
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
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uk_body_metric_user_date (user_id, log_date),
       FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
     )`
  );
}

async function seedDemoUser() {
  const connection = await pool.getConnection();

  try {
    await ensureSchema(connection);
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(
      DEMO.password,
      Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    );

    const [existing] = await connection.execute(
      'SELECT user_id FROM USER WHERE email = ?',
      [DEMO.email]
    );

    let userId;

    if (existing.length) {
      userId = existing[0].user_id;
      await connection.execute(
        `UPDATE USER
         SET first_name = ?, last_name = ?, password_hash = ?, date_of_birth = ?, gender = ?, height_cm = ?
         WHERE user_id = ?`,
        [DEMO.first_name, DEMO.last_name, passwordHash, DEMO.date_of_birth,
         DEMO.gender, DEMO.height_cm, userId]
      );
    } else {
      const [result] = await connection.execute(
        `INSERT INTO USER
          (first_name, last_name, email, password_hash, date_of_birth, gender, height_cm)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [DEMO.first_name, DEMO.last_name, DEMO.email, passwordHash,
         DEMO.date_of_birth, DEMO.gender, DEMO.height_cm]
      );
      userId = result.insertId;
    }

    // Reset demo data (children auto-cascade from FK on DELETE)
    await connection.execute(
      'DELETE FROM GOAL_PROGRESS WHERE goal_id IN (SELECT goal_id FROM GOAL WHERE user_id = ?)',
      [userId]
    );
    await connection.execute('DELETE FROM GOAL WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM WORKOUT WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM MEAL WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM WATER_LOG WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM BODY_METRIC WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM WORKOUT_PLAN WHERE user_id = ?', [userId]);

    // ---------- EXERCISE LIBRARY ----------
    const exercises = [
      ['Barbell Back Squat',     'Compound',    'Quads',         'Barbell'],
      ['Romanian Deadlift',      'Compound',    'Hamstrings',    'Barbell'],
      ['Dumbbell Lunges',        'Unilateral',  'Quads',         'Dumbbell'],
      ['Leg Press',              'Machine',     'Quads',         'Machine'],
      ['Hip Thrust',             'Isolation',   'Glutes',        'Barbell'],
      ['Standing Calf Raise',    'Isolation',   'Calves',        'Bodyweight'],
      ['Bench Press',            'Compound',    'Chest',         'Barbell'],
      ['Incline Dumbbell Press', 'Compound',    'Chest',         'Dumbbell'],
      ['Pull Up',                'Compound',    'Back',          'Bodyweight'],
      ['Bent Over Row',          'Compound',    'Back',          'Barbell'],
      ['Lat Pulldown',           'Machine',     'Back',          'Machine'],
      ['Overhead Press',         'Compound',    'Shoulders',     'Barbell'],
      ['Lateral Raise',          'Isolation',   'Shoulders',     'Dumbbell'],
      ['Bicep Curl',             'Isolation',   'Biceps',        'Dumbbell'],
      ['Tricep Pushdown',        'Isolation',   'Triceps',       'Cable'],
      ['Plank',                  'Bodyweight',  'Core',          'Bodyweight'],
      ['Hanging Leg Raise',      'Bodyweight',  'Core',          'Bodyweight'],
      ['Russian Twist',          'Bodyweight',  'Core',          'Bodyweight'],
      ['Treadmill Run',          'Cardio',      'Cardio',        'Machine'],
      ['Cycling',                'Cardio',      'Cardio',       'Machine'],
      ['Yoga Flow',              'Mobility',    'Full Body',     'Bodyweight'],
      ['Walking',                'Cardio',      'Cardio',       'Bodyweight'],
    ];

    const exerciseIds = {};
    for (const ex of exercises) {
      const [res] = await connection.execute(
        `INSERT INTO EXERCISE (name, category, muscle_group, equipment)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE exercise_id = exercise_id`,
        ex
      );
      // MySQL returns insertId=0 for ON DUP UPDATE — fetch the row.
      const [row] = await connection.execute(
        'SELECT exercise_id FROM EXERCISE WHERE name = ?',
        [ex[0]]
      );
      exerciseIds[ex[0]] = row[0].exercise_id;
    }

    // ---------- ACTIVE WORKOUT PLAN ----------
    const [planResult] = await connection.execute(
      `INSERT INTO WORKOUT_PLAN
        (user_id, plan_name, description, difficulty, duration_weeks, status)
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [userId, 'Beginner Fitness Plan',
       'Balanced weekly plan combining cardio, strength and recovery.',
       'Beginner', 4]
    );
    const planId = planResult.insertId;

    // Plan items (sessions)
    const planItems = [
      {
        day_number: 1,
        activity_name: 'Lower Body Strength',
        activity_type: 'Strength Training',
        target_duration_minutes: 50,
        target_intensity: 'High',
        exercises: [
          { name: 'Barbell Back Squat',  sets: 4, reps: '8-10',  weight_kg: 60,  rest_seconds: 90 },
          { name: 'Romanian Deadlift',   sets: 3, reps: '10-12', weight_kg: 50,  rest_seconds: 90 },
          { name: 'Dumbbell Lunges',     sets: 3, reps: '12 each', weight_kg: 20, rest_seconds: 60 },
          { name: 'Leg Press',          sets: 4, reps: '10',    weight_kg: 90,  rest_seconds: 90 },
          { name: 'Hip Thrust',         sets: 3, reps: '15',     weight_kg: 40,  rest_seconds: 60 },
          { name: 'Standing Calf Raise', sets: 3, reps: '20',    weight_kg: null, rest_seconds: 45 },
        ],
      },
      {
        day_number: 2,
        activity_name: 'Easy Run',
        activity_type: 'Running',
        target_duration_minutes: 30,
        target_intensity: 'Low',
        exercises: [
          { name: 'Treadmill Run', sets: 1, reps: '30 min', weight_kg: null, rest_seconds: 0 },
        ],
      },
      {
        day_number: 3,
        activity_name: 'Upper Body Strength',
        activity_type: 'Strength Training',
        target_duration_minutes: 50,
        target_intensity: 'High',
        exercises: [
          { name: 'Bench Press',            sets: 4, reps: '8-10', weight_kg: 50, rest_seconds: 90 },
          { name: 'Bent Over Row',          sets: 4, reps: '8-10', weight_kg: 40, rest_seconds: 90 },
          { name: 'Overhead Press',         sets: 3, reps: '10',    weight_kg: 25, rest_seconds: 75 },
          { name: 'Lat Pulldown',           sets: 3, reps: '12',   weight_kg: 40, rest_seconds: 60 },
          { name: 'Bicep Curl',             sets: 3, reps: '12',    weight_kg: 12, rest_seconds: 45 },
          { name: 'Tricep Pushdown',        sets: 3, reps: '15',    weight_kg: 25, rest_seconds: 45 },
        ],
      },
      {
        day_number: 4,
        activity_name: 'Core & Mobility',
        activity_type: 'Yoga',
        target_duration_minutes: 30,
        target_intensity: 'Low',
        exercises: [
          { name: 'Plank',              sets: 3, reps: '60 sec', weight_kg: null, rest_seconds: 30 },
          { name: 'Hanging Leg Raise', sets: 3, reps: '12',      weight_kg: null, rest_seconds: 45 },
          { name: 'Russian Twist',     sets: 3, reps: '20',      weight_kg: null, rest_seconds: 30 },
          { name: 'Yoga Flow',         sets: 1, reps: '15 min',  weight_kg: null, rest_seconds: 0 },
        ],
      },
    ];

    const planItemIds = {};
    for (const item of planItems) {
      const [itemRes] = await connection.execute(
        `INSERT INTO WORKOUT_PLAN_ITEM
           (plan_id, activity_name, activity_type, target_duration_minutes, target_intensity, day_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [planId, item.activity_name, item.activity_type,
         item.target_duration_minutes, item.target_intensity, item.day_number]
      );
      const itemId = itemRes.insertId;
      planItemIds[item.day_number] = itemId;

      for (let i = 0; i < item.exercises.length; i++) {
        const ex = item.exercises[i];
        await connection.execute(
          `INSERT INTO PLAN_EXERCISE
             (plan_item_id, exercise_id, sets, reps, weight_kg, rest_seconds, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, exerciseIds[ex.name], ex.sets, ex.reps, ex.weight_kg,
           ex.rest_seconds, i]
        );
      }
    }

    // ---------- WORKOUTS (some linked to plan items, running sessions carry distance) ----------
    const workouts = [
      // 3 of these are completed sessions of the plan
      ['Lower Body Strength', 'Strength Training', 50, 'High',   420, 0,    '2026-08-10', 'Lower body session',  planId, planItemIds[1]],
      ['Easy Run',            'Running',           30, 'Low',    280, 4.2,  '2026-08-12', 'Easy run',            planId, planItemIds[2]],
      ['Upper Body Strength', 'Strength Training', 50, 'High',   430, 0,    '2026-08-14', 'Upper body session',  planId, planItemIds[3]],
      // The other two are not part of the plan (just extras)
      ['Morning 5K Run',      'Running',           35, 'Medium', 310, 5.0,  '2026-08-17', 'Morning run',         null, null],
      ['Recovery Yoga',       'Yoga',              40, 'Low',    150, 0,    '2026-08-09', 'Recovery session',    null, null],
    ];

    for (const w of workouts) {
      await connection.execute(
        `INSERT INTO WORKOUT
          (user_id, activity_name, workout_type, duration_minutes, intensity,
           calories_burned, distance_km, workout_date, notes, plan_id, plan_item_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, ...w]
      );
    }

    // ---------- BODY METRICS (8 weekly logs, weight 76.0 -> 74.0 kg) ----------
    const bodyMetrics = [
      ['2026-06-29', 76.0, 24.8, 19.5, 97.0, 84.0, 96.0, 33.0],
      ['2026-07-06', 75.6, 24.7, 19.3, 96.5, 83.5, 95.5, 33.2],
      ['2026-07-13', 75.3, 24.6, 19.1, 96.5, 83.5, 95.5, 33.4],
      ['2026-07-20', 75.0, 24.5, 18.9, 96.0, 83.0, 95.0, 33.5],
      ['2026-07-27', 74.7, 24.4, 18.7, 96.0, 82.5, 94.5, 33.7],
      ['2026-08-03', 74.4, 24.3, 18.6, 95.5, 82.5, 94.5, 33.9],
      ['2026-08-10', 74.2, 24.2, 18.5, 95.5, 82.0, 94.0, 34.0],
      ['2026-08-17', 74.0, 24.2, 18.3, 95.0, 82.0, 94.0, 34.2],
    ];
    for (const m of bodyMetrics) {
      await connection.execute(
        `INSERT INTO BODY_METRIC
          (user_id, log_date, weight_kg, bmi, body_fat_pct, chest_cm, waist_cm, hips_cm, arms_cm)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, ...m]
      );
    }

    // ---------- MEALS ----------
    const meals = [
      ['Breakfast', 'Greek yoghurt & berries', 380, 24, 42, 10, '2026-08-17'],
      ['Lunch',     'Chicken grain bowl',      620, 46, 68, 18, '2026-08-17'],
      ['Snack',     'Banana & almonds',        250,  7, 30, 12, '2026-08-17'],
      ['Dinner',    'Salmon with vegetables',  540, 42, 34, 24, '2026-08-17'],
    ];
    for (const meal of meals) {
      await connection.execute(
        `INSERT INTO MEAL
          (user_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, meal_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, ...meal]
      );
    }

    // ---------- FOOD DATABASE ----------
    await connection.execute('DELETE FROM FOOD WHERE user_id IS NULL');
    const foods = [
      ['Banana',                '0000000000017', 'Produce',         118, 'g',   105, 1.3, 27, 0.4],
      ['Apple',                 null,            'Produce',         182, 'g',    95, 0.5, 25, 0.3],
      ['Chicken Breast (Grilled)', null,         'Meat',            100, 'g',   165, 31,  0,  3.6],
      ['Egg (Large)',           '0000000000024', 'Dairy & Eggs',     50, 'g',    72, 6.3, 0.4, 4.8],
      ['Greek Yoghurt',          null,            'Dairy & Eggs',    170, 'g',   100, 17,  3.8, 0.7],
      ['Whole Grain Bread',     '0000000000031', 'Grains',           60, 'g',   160, 7,   28,  2.5],
      ['Brown Rice (Cooked)',    null,            'Grains',          195, 'g',   216, 5,   45,  1.8],
      ['Oats',                   null,            'Grains',           40, 'g',   150, 5,   27,  3],
      ['Couscous (Cooked)',      null,            'Grains',          157, 'g',   176, 6,   36,  0.3],
      ['Salmon Fillet',          null,            'Meat',            170, 'g',   280, 34,  0,   15],
      ['Ground Turkey (Lean)',   null,            'Meat',            120, 'g',   186, 27,  0,   8],
      ['Tuna (Canned)',          null,            'Meat',            142, 'g',   130, 28,  0,   1],
      ['Broccoli (Steamed)',     null,            'Produce',         156, 'g',    55, 3.7, 11,  0.6],
      ['Sweet Potato (Baked)',   null,            'Produce',         150, 'g',   130, 2.5, 30,  0.2],
      ['Avocado',                null,            'Produce',         150, 'g',   240, 3,   12,  22],
      ['Blueberries',            null,            'Produce',         148, 'g',    84, 1.1, 21,  0.5],
      ['Almonds',                null,            'Nuts & Seeds',     28, 'g',   164, 6,   6,   14],
      ['Peanut Butter',          null,            'Nuts & Seeds',     32, 'g',   190, 8,   7,   16],
      ['Lentils (Cooked)',       null,            'Legumes',         198, 'g',   230, 18,  40,  0.8],
      ['Tofu (Firm)',            null,            'Legumes',         122, 'g',    94, 10,  3,   5],
      ['Whole Milk',             null,            'Dairy & Eggs',    244, 'ml',  146, 8,   12,  8],
      ['Cheddar Cheese',         null,            'Dairy & Eggs',     28, 'g',   113, 7,   0.9, 9],
      ['Cottage Cheese',         null,            'Dairy & Eggs',    113, 'g',    98, 12,  5,   4],
      ['Orange Juice',          '0000000000048', 'Beverages',       200, 'ml',  112, 1.7, 26,  0.5],
      ['Granola Bar',           '0000000000055', 'Snacks',           40, 'g',   170, 3,   24,  7],
      ['Dark Chocolate',         null,            'Snacks',           30, 'g',   170, 2,   13,  12],
      ['Rice Cakes',             null,            'Snacks',           20, 'g',    70, 1,   15,  0.5],
      ['Protein Shake',         '0000000000062', 'Beverages',       330, 'ml',  180, 25,  8,   4],
    ];
    for (const f of foods) {
      await connection.execute(
        `INSERT INTO FOOD
          (name, barcode, category, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        f
      );
    }

    // ---------- WATER LOG ----------
    const waterEntries = [
      ['2026-08-17', 250, '2026-08-17 08:00:00'],
      ['2026-08-17', 500, '2026-08-17 10:30:00'],
      ['2026-08-17', 300, '2026-08-17 12:00:00'],
      ['2026-08-17', 500, '2026-08-17 14:15:00'],
      ['2026-08-17', 250, '2026-08-17 17:00:00'],
    ];
    for (const w of waterEntries) {
      await connection.execute(
        `INSERT INTO WATER_LOG (user_id, log_date, amount_ml, logged_at)
         VALUES (?, ?, ?, ?)`,
        [userId, ...w]
      );
    }

    // ---------- GOALS ----------
    const [weeklyGoal] = await connection.execute(
      `INSERT INTO GOAL
        (user_id, goal_type, target_value, current_value, start_date, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [userId, 'Weekly workouts', 5, 3, '2026-08-17', '2026-08-23']
    );
    await connection.execute(
      `INSERT INTO GOAL_PROGRESS (goal_id, log_date, value) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [weeklyGoal.insertId, '2026-08-13', 1,
       weeklyGoal.insertId, '2026-08-15', 2,
       weeklyGoal.insertId, '2026-08-17', 3]
    );

    const [weightGoal] = await connection.execute(
      `INSERT INTO GOAL
        (user_id, goal_type, target_value, current_value, start_date, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [userId, 'Healthy weight', 70, 74, '2026-08-01', '2026-12-01']
    );
    await connection.execute(
      `INSERT INTO GOAL_PROGRESS (goal_id, log_date, value) VALUES (?, ?, ?), (?, ?, ?)`,
      [weightGoal.insertId, '2026-08-01', 76,
       weightGoal.insertId, '2026-08-17', 74]
    );

    // ---------- OTHER PLANS (Paused + Completed) ----------
    await connection.execute(
      `INSERT INTO WORKOUT_PLAN
        (user_id, plan_name, description, difficulty, duration_weeks, status)
       VALUES (?, ?, ?, ?, ?, 'Paused')`,
      [userId, '5K Running Plan', 'Cardio plan for beginners.', 'Beginner', 6]
    );

    await connection.execute(
      `INSERT INTO WORKOUT_PLAN
        (user_id, plan_name, description, difficulty, duration_weeks, status)
       VALUES (?, ?, ?, ?, ?, 'Completed')`,
      [userId, '30-Day Yoga Challenge', 'Daily flexibility & mindfulness.', 'Beginner', 4]
    );

    // ---------- SETTINGS (including nutrition goals) ----------
    await connection.execute(
      `INSERT INTO SETTINGS
        (user_id, daily_step_goal, daily_workout_minutes, daily_calorie_burn_goal,
         daily_hydration_litres, daily_calorie_goal, daily_protein_goal, daily_carbs_goal,
         daily_fat_goal, research_data_sharing, email_reminders, public_profile_visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         daily_step_goal = VALUES(daily_step_goal),
         daily_workout_minutes = VALUES(daily_workout_minutes),
         daily_calorie_burn_goal = VALUES(daily_calorie_burn_goal),
         daily_hydration_litres = VALUES(daily_hydration_litres),
         daily_calorie_goal = VALUES(daily_calorie_goal),
         daily_protein_goal = VALUES(daily_protein_goal),
         daily_carbs_goal = VALUES(daily_carbs_goal),
         daily_fat_goal = VALUES(daily_fat_goal),
         research_data_sharing = VALUES(research_data_sharing),
         email_reminders = VALUES(email_reminders),
         public_profile_visibility = VALUES(public_profile_visibility)`,
      [userId, 10000, 60, 500, 2.5, 2200, 150, 275, 73, false, true, false]
    );

    await connection.commit();

    console.log('\n✓ FitTrack demo account is ready.');
    console.log(`  Email:    ${DEMO.email}`);
    console.log(`  Password: ${DEMO.password}`);
    console.log(`  User ID:  ${userId}`);
    console.log('  • 1 Active plan with 4 sessions + 16 exercises');
    console.log('  • 1 Paused plan, 1 Completed plan');
    console.log('  • 5 workouts (3 linked to active plan, 2 standalone)');
    console.log('  • 4 meals, 2 goals, 22-exercise library');
    console.log(`  • ${foods.length}-item food database with barcodes`);
    console.log('  • 5 water entries + nutrition goals');
    console.log('  • 8 weekly body metrics (weight/BMI/body fat/measurements)');
    console.log('  • Settings configured\n');
  } catch (error) {
    await connection.rollback();
    console.error('Unable to seed the FitTrack demo account:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDemoUser();