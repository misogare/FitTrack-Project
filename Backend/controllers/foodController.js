import pool from '../config/db.js';
import { validationResult } from 'express-validator';

const numOr = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const getFoods = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const { q, barcode, category, limit } = req.query;

    const params = [];
    let where = '(user_id IS NULL OR user_id = ?)';
    params.push(user_id);

    if (barcode) {
      where += ' AND barcode = ?';
      params.push(String(barcode).trim());
    } else if (q && q.trim()) {
      // Match by name, and by barcode prefix when searching digits.
      where += ' AND (name LIKE ? OR barcode LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }

    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    params.push(lim);

    const [rows] = await pool.execute(
      `SELECT food_id, name, barcode, category, serving_size, serving_unit,
              calories, protein_g, carbs_g, fat_g, user_id
       FROM FOOD
       WHERE ${where}
       ORDER BY name ASC
       LIMIT ?`,
      params
    );

    const foods = rows.map(r => ({ ...r, is_custom: r.user_id !== null }));
    res.json({ foods });
  } catch (err) {
    next(err);
  }
};

export const getFoodByBarcode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const [rows] = await pool.execute(
      `SELECT food_id, name, barcode, category, serving_size, serving_unit,
              calories, protein_g, carbs_g, fat_g, user_id
       FROM FOOD
       WHERE barcode = ? AND (user_id IS NULL OR user_id = ?)
       LIMIT 1`,
      [String(code).trim(), req.user.user_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'No food found for this barcode' });
    }

    const [food] = rows;
    res.json({ food: { ...food, is_custom: food.user_id !== null } });
  } catch (err) {
    next(err);
  }
};

export const createFood = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      name,
      barcode,
      category,
      serving_size,
      serving_unit,
      calories,
      protein_g,
      carbs_g,
      fat_g,
    } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      `INSERT INTO FOOD
        (name, barcode, category, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        barcode || null,
        category || null,
        numOr(serving_size, null),
        serving_unit || null,
        calories,
        numOr(protein_g, null),
        numOr(carbs_g, null),
        numOr(fat_g, null),
        user_id,
      ]
    );

    res.status(201).json({ message: 'Food created successfully', food_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A food with this barcode already exists' });
    }
    next(err);
  }
};

export const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM FOOD WHERE food_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Food not found or not owned by you' });
    }

    res.json({ message: 'Food deleted' });
  } catch (err) {
    next(err);
  }
};
