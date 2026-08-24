import pool from '../config/db.js';
import { validationResult } from 'express-validator';

const DEFAULT_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 275,
  fat: 73,
  hydration_litres: 2.5,
};

async function getGoalsRow(user_id) {
  const [rows] = await pool.execute(
    `SELECT daily_calorie_goal, daily_protein_goal, daily_carbs_goal,
            daily_fat_goal, daily_hydration_litres
     FROM SETTINGS WHERE user_id = ?`,
    [user_id]
  );
  const row = rows[0] || {};
  return {
    calories: numOr(row.daily_calorie_goal, DEFAULT_GOALS.calories),
    protein: numOr(row.daily_protein_goal, DEFAULT_GOALS.protein),
    carbs: numOr(row.daily_carbs_goal, DEFAULT_GOALS.carbs),
    fat: numOr(row.daily_fat_goal, DEFAULT_GOALS.fat),
    hydration_litres: numOr(row.daily_hydration_litres, DEFAULT_GOALS.hydration_litres),
  };
}

const numOr = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const getNutritionGoals = async (req, res, next) => {
  try {
    const goals = await getGoalsRow(req.user.user_id);
    res.json({ goals });
  } catch (err) {
    next(err);
  }
};

export const updateNutritionGoals = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user_id = req.user.user_id;

    // Ensure a settings row exists for this user.
    await pool.execute(
      `INSERT INTO SETTINGS (user_id)
       VALUES (?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [user_id]
    );

    const columnMap = {
      calories: 'daily_calorie_goal',
      protein: 'daily_protein_goal',
      carbs: 'daily_carbs_goal',
      fat: 'daily_fat_goal',
      hydration_litres: 'daily_hydration_litres',
    };

    const updates = [];
    const params = [];
    for (const [field, column] of Object.entries(columnMap)) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        updates.push(`${column} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No nutrition goal fields provided' });
    }

    params.push(user_id);
    await pool.execute(`UPDATE SETTINGS SET ${updates.join(', ')} WHERE user_id = ?`, params);

    res.json({ message: 'Nutrition goals updated', goals: await getGoalsRow(user_id) });
  } catch (err) {
    next(err);
  }
};

export const getWaterLog = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const { date } = req.query;

    const params = [user_id];
    let where = 'user_id = ?';
    if (date) {
      where += ' AND log_date = ?';
      params.push(date);
    }

    const [rows] = await pool.execute(
      `SELECT water_log_id, amount_ml,
              DATE_FORMAT(log_date, '%Y-%m-%d') as log_date,
              DATE_FORMAT(logged_at, '%H:%i') as logged_time
       FROM WATER_LOG
       WHERE ${where}
       ORDER BY logged_at DESC, water_log_id DESC`,
      params
    );

    const total_ml = rows.reduce((sum, r) => sum + numOr(r.amount_ml, 0), 0);
    res.json({ entries: rows, total_ml });
  } catch (err) {
    next(err);
  }
};

export const logWater = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { log_date, amount_ml } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      'INSERT INTO WATER_LOG (user_id, log_date, amount_ml) VALUES (?, ?, ?)',
      [user_id, log_date, amount_ml]
    );

    res.status(201).json({ message: 'Water logged successfully', water_log_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const deleteWaterLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute(
      'DELETE FROM WATER_LOG WHERE water_log_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );
    res.json({ message: 'Water entry deleted' });
  } catch (err) {
    next(err);
  }
};
