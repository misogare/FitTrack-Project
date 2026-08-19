import pool from '../config/db.js';
import { validationResult } from 'express-validator';

export const createWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const {
  activity_name,
  workout_type,
  duration_minutes,
  intensity,
  calories_burned,
  workout_date,
  notes,
  plan_id,
  plan_item_id
} = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
  `INSERT INTO WORKOUT
    (
      user_id,
      plan_id,
      plan_item_id,
      activity_name,
      workout_type,
      duration_minutes,
      intensity,
      calories_burned,
      workout_date,
      notes
    )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    user_id,
    plan_id || null,
    plan_item_id || null,
    activity_name,
    workout_type,
    duration_minutes,
    intensity,
    calories_burned || null,
    workout_date,
    notes || null
  ]
);

    res.status(201).json({ message: 'Workout saved successfully', workout_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getWorkouts = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.execute(
  `SELECT
      w.workout_id,
      w.activity_name,
      w.workout_type,
      w.duration_minutes,
      w.intensity,
      w.calories_burned,
      DATE_FORMAT(w.workout_date, '%Y-%m-%d') AS workout_date,
      w.notes,
      w.plan_id,
      w.plan_item_id,
      p.plan_name,
      w.created_at,
      w.updated_at
   FROM WORKOUT w
   LEFT JOIN WORKOUT_PLAN p
     ON w.plan_id = p.plan_id
   WHERE w.user_id = ?
   ORDER BY w.workout_date DESC, w.created_at DESC`,
  [user_id]
);
    res.json({ workouts: rows });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM WORKOUT WHERE workout_id = ? AND user_id = ?', [id, req.user.user_id]);
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    next(err);
  }
};
export const updateWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const {
      activity_name,
      workout_type,
      duration_minutes,
      intensity,
      calories_burned,
      workout_date,
      notes,
      plan_id,
      plan_item_id
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE WORKOUT
       SET
         activity_name = ?,
         workout_type = ?,
         duration_minutes = ?,
         intensity = ?,
         calories_burned = ?,
         workout_date = ?,
         notes = ?,
         plan_id = ?,
         plan_item_id = ?
       WHERE workout_id = ?
       AND user_id = ?`,
      [
        activity_name,
        workout_type,
        duration_minutes,
        intensity,
        calories_burned || null,
        workout_date,
        notes || null,
        plan_id || null,
        plan_item_id || null,
        id,
        req.user.user_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Workout not found'
      });
    }

    res.json({
      message: 'Workout updated successfully'
    });
  } catch (err) {
    next(err);
  }
};
export const getDailySummary = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    // Today's totals from WORKOUT
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(SUM(duration_minutes), 0)                 AS total_minutes,
         COALESCE(SUM(calories_burned), 0)                  AS total_calories,
         COUNT(*)                                           AS total_sessions
       FROM WORKOUT
       WHERE user_id = ?
         AND workout_date = CURDATE()`,
      [user_id]
    );

    // Targets from SETTINGS (fall back to sane defaults if missing)
    const [settings] = await pool.execute(
      `SELECT
         COALESCE(daily_workout_minutes, 60)  AS daily_workout_minutes,
         COALESCE(daily_calorie_burn_goal, 500) AS daily_calorie_burn_goal
       FROM SETTINGS
       WHERE user_id = ?`,
      [user_id]
    );

    const s = settings[0] || {
      daily_workout_minutes: 60,
      daily_calorie_burn_goal: 500,
    };

    const totalMinutes   = Number(rows[0].total_minutes);
    const totalCalories  = Number(rows[0].total_calories);
    const totalSessions  = Number(rows[0].total_sessions);

    // For sessions we don't have a per-user target column, so use 2 as default
    const sessionTarget = 2;

    const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));

    res.json({
      date: new Date().toISOString().slice(0, 10),
      goals: {
        dailyActivity: {
          value: totalMinutes,
          target: Number(s.daily_workout_minutes),
          unit: 'min',
          percent: clamp((totalMinutes / Number(s.daily_workout_minutes)) * 100),
        },
        caloriesBurned: {
          value: totalCalories,
          target: Number(s.daily_calorie_burn_goal),
          unit: 'kcal',
          percent: clamp((totalCalories / Number(s.daily_calorie_burn_goal)) * 100),
        },
        workoutSessions: {
          value: totalSessions,
          target: sessionTarget,
          unit: 'sessions',
          percent: clamp((totalSessions / sessionTarget) * 100),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};