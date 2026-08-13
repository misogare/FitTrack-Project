import pool from '../config/db.js';
import { validationResult } from 'express-validator';

export const createMeal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { meal_type, food_name, calories, protein_g, carbs_g, fat_g, meal_date } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      `INSERT INTO MEAL (user_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, meal_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, meal_type, food_name, calories, protein_g || null, carbs_g || null, fat_g || null, meal_date]
    );

    res.status(201).json({ message: 'Meal logged successfully', meal_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getMeals = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.execute(
      `SELECT meal_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g,
              DATE_FORMAT(meal_date, '%d/%m/%Y') as meal_date, created_at
       FROM MEAL WHERE user_id = ? ORDER BY meal_date DESC, created_at DESC`,
      [user_id]
    );
    res.json({ meals: rows });
  } catch (err) {
    next(err);
  }
};

export const deleteMeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM MEAL WHERE meal_id = ? AND user_id = ?', [id, req.user.user_id]);
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    next(err);
  }
};