import pool from '../config/db.js';
import { validationResult } from 'express-validator';

export const createWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { workout_type, duration_minutes, intensity, calories_burned, workout_date, notes } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      `INSERT INTO WORKOUT (user_id, workout_type, duration_minutes, intensity, calories_burned, workout_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, workout_type, duration_minutes, intensity, calories_burned || null, workout_date, notes || null]
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
      `SELECT workout_id, workout_type, duration_minutes, intensity, calories_burned, 
              DATE_FORMAT(workout_date, '%d/%m/%Y') as workout_date, notes, created_at
       FROM WORKOUT WHERE user_id = ? ORDER BY workout_date DESC, created_at DESC`,
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