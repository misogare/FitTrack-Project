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
  height_cm: 175
};

async function seedDemoUser() {
  const connection = await pool.getConnection();

  try {
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
        [
          DEMO.first_name,
          DEMO.last_name,
          passwordHash,
          DEMO.date_of_birth,
          DEMO.gender,
          DEMO.height_cm,
          userId
        ]
      );
    } else {
      const [result] = await connection.execute(
        `INSERT INTO USER
          (first_name, last_name, email, password_hash, date_of_birth, gender, height_cm)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          DEMO.first_name,
          DEMO.last_name,
          DEMO.email,
          passwordHash,
          DEMO.date_of_birth,
          DEMO.gender,
          DEMO.height_cm
        ]
      );
      userId = result.insertId;
    }

    // Reset only this demo account's sample data so the seed is repeatable.
    await connection.execute(
      'DELETE FROM GOAL_PROGRESS WHERE goal_id IN (SELECT goal_id FROM GOAL WHERE user_id = ?)',
      [userId]
    );
    await connection.execute('DELETE FROM GOAL WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM WORKOUT WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM MEAL WHERE user_id = ?', [userId]);

    // Recent workouts for dashboard/activity views.
    const workouts = [
      ['Running', 35, 'Medium', 310, '2026-08-17', 'Morning run'],
      ['Strength Training', 50, 'High', 420, '2026-08-15', 'Upper body session'],
      ['Cycling', 45, 'Medium', 360, '2026-08-13', 'Outdoor cycling'],
      ['Walking', 30, 'Low', 130, '2026-08-11', 'Evening walk'],
      ['Yoga', 40, 'Low', 150, '2026-08-09', 'Recovery session']
    ];

    for (const workout of workouts) {
      await connection.execute(
        `INSERT INTO WORKOUT
          (user_id, workout_type, duration_minutes, intensity, calories_burned, workout_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, ...workout]
      );
    }

    // Today's meals for the nutrition dashboard.
    const meals = [
      ['Breakfast', 'Greek yoghurt & berries', 380, 24, 42, 10, '2026-08-17'],
      ['Lunch', 'Chicken grain bowl', 620, 46, 68, 18, '2026-08-17'],
      ['Snack', 'Banana & almonds', 250, 7, 30, 12, '2026-08-17'],
      ['Dinner', 'Salmon with vegetables', 540, 42, 34, 24, '2026-08-17']
    ];

    for (const meal of meals) {
      await connection.execute(
        `INSERT INTO MEAL
          (user_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, meal_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, ...meal]
      );
    }

    const [goalResult] = await connection.execute(
      `INSERT INTO GOAL
        (user_id, goal_type, target_value, current_value, start_date, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [userId, 'Weekly workouts', 5, 3, '2026-08-17', '2026-08-23']
    );

    await connection.execute(
      `INSERT INTO GOAL_PROGRESS (goal_id, log_date, value)
       VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        goalResult.insertId, '2026-08-13', 1,
        goalResult.insertId, '2026-08-15', 2,
        goalResult.insertId, '2026-08-17', 3
      ]
    );

    const [weightGoal] = await connection.execute(
      `INSERT INTO GOAL
        (user_id, goal_type, target_value, current_value, start_date, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [userId, 'Healthy weight', 70, 74, '2026-08-01', '2026-12-01']
    );

    await connection.execute(
      `INSERT INTO GOAL_PROGRESS (goal_id, log_date, value)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [
        weightGoal.insertId, '2026-08-01', 76,
        weightGoal.insertId, '2026-08-17', 74
      ]
    );

    await connection.commit();

    console.log('\nFitTrack demo account is ready.');
    console.log(`Email:    ${DEMO.email}`);
    console.log(`Password: ${DEMO.password}`);
    console.log(`User ID:  ${userId}`);
    console.log('Sample workouts, meals and goals were reset and seeded for this account.\n');
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
