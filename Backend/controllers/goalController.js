import pool from '../config/db.js';
import { validationResult } from 'express-validator';

export const createGoal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { goal_type, target_value, start_value, start_date, target_date } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      `INSERT INTO GOAL (user_id, goal_type, start_value, target_value, current_value, start_date, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [user_id, goal_type, start_value || 0, target_value, 0, start_date, target_date]
    );

    res.status(201).json({ message: 'Goal created successfully', goal_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// A goal is reached when the current value passes the target in the direction
// the goal is heading (target above the start value = increasing goal).
const goalReached = (start, current, target) =>
  target >= start ? current >= target : current <= target;

export const updateGoal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const user_id = req.user.user_id;

    const [existing] = await pool.execute(
      'SELECT * FROM GOAL WHERE goal_id = ? AND user_id = ?',
      [id, user_id]
    );
    if (existing.length === 0) return res.status(404).json({ message: 'Goal not found' });
    const goal = existing[0];

    const fields = {
      goal_type: req.body.goal_type ?? goal.goal_type,
      start_value: req.body.start_value ?? goal.start_value,
      target_value: req.body.target_value ?? goal.target_value,
      current_value: req.body.current_value ?? goal.current_value,
      start_date: req.body.start_date ?? goal.start_date,
      target_date: req.body.target_date ?? goal.target_date,
      status: req.body.status ?? goal.status,
    };

    await pool.execute(
      `UPDATE GOAL
       SET goal_type = ?, start_value = ?, target_value = ?, current_value = ?,
           start_date = ?, target_date = ?, status = ?
       WHERE goal_id = ? AND user_id = ?`,
      [fields.goal_type, fields.start_value, fields.target_value, fields.current_value,
       fields.start_date, fields.target_date, fields.status, id, user_id]
    );

    res.json({ message: 'Goal updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.execute(
      `SELECT goal_id, goal_type, start_value, target_value, current_value, status,
              DATE_FORMAT(start_date, '%d/%m/%Y') as start_date,
              DATE_FORMAT(target_date, '%d/%m/%Y') as target_date
       FROM GOAL WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    res.json({ goals: rows });
  } catch (err) {
    next(err);
  }
};

export const addProgress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { goal_id, log_date, value } = req.body;
    const user_id = req.user.user_id;

    // Verify goal ownership
    const [goals] = await pool.execute('SELECT * FROM GOAL WHERE goal_id = ? AND user_id = ?', [goal_id, user_id]);
    if (goals.length === 0) return res.status(404).json({ message: 'Goal not found' });

    await pool.execute(
      'INSERT INTO GOAL_PROGRESS (goal_id, log_date, value) VALUES (?, ?, ?)',
      [goal_id, log_date, value]
    );

    // Update current value on goal, auto-completing when the target is reached
    const reached = goalReached(Number(goals[0].start_value), Number(value), Number(goals[0].target_value));
    const nextStatus = reached ? 'Achieved' : 'Active';
    await pool.execute(
      'UPDATE GOAL SET current_value = ?, status = ? WHERE goal_id = ?',
      [value, nextStatus, goal_id]
    );

    res.json({ message: 'Progress updated successfully', status: nextStatus });
  } catch (err) {
    next(err);
  }
};

export const getGoalProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT log_id, DATE_FORMAT(log_date, '%d/%m/%Y') as log_date, value, created_at
       FROM GOAL_PROGRESS WHERE goal_id = ? ORDER BY log_date DESC`,
      [id]
    );
    res.json({ progress: rows });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM GOAL WHERE goal_id = ? AND user_id = ?', [id, req.user.user_id]);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
};