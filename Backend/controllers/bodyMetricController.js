import pool from '../config/db.js';
import { validationResult } from 'express-validator';

// One row per (user, log_date). If weight is logged without a BMI,
// compute it from the user's stored height.
async function resolveBmi(userId, weightKg, providedBmi) {
  if (providedBmi != null) return providedBmi;
  if (weightKg == null) return null;
  const [rows] = await pool.execute('SELECT height_cm FROM USER WHERE user_id = ?', [userId]);
  const heightCm = Number(rows[0]?.height_cm);
  if (!heightCm) return null;
  return Math.round((Number(weightKg) / (heightCm / 100) ** 2) * 100) / 100;
}

export const getBodyMetrics = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 0, 500) : 0;

    const [rows] = await pool.execute(
      `SELECT
         body_metric_id,
         DATE_FORMAT(log_date, '%Y-%m-%d') AS log_date,
         weight_kg,
         bmi,
         body_fat_pct,
         chest_cm,
         waist_cm,
         hips_cm,
         arms_cm
       FROM BODY_METRIC
       WHERE user_id = ?
       ORDER BY log_date DESC${limit ? ' LIMIT ' + limit : ''}`,
      [user_id]
    );

    res.json({ metrics: rows });
  } catch (err) {
    next(err);
  }
};

export const logBodyMetric = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user_id = req.user.user_id;
    const {
      log_date,
      weight_kg,
      bmi,
      body_fat_pct,
      chest_cm,
      waist_cm,
      hips_cm,
      arms_cm,
    } = req.body;

    const bmiValue = await resolveBmi(user_id, weight_kg, bmi);

    // Upsert per (user_id, log_date) so re-logging a day updates the entry.
    await pool.execute(
      `INSERT INTO BODY_METRIC
         (user_id, log_date, weight_kg, bmi, body_fat_pct, chest_cm, waist_cm, hips_cm, arms_cm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         weight_kg = VALUES(weight_kg),
         bmi = VALUES(bmi),
         body_fat_pct = VALUES(body_fat_pct),
         chest_cm = VALUES(chest_cm),
         waist_cm = VALUES(waist_cm),
         hips_cm = VALUES(hips_cm),
         arms_cm = VALUES(arms_cm)`,
      [
        user_id,
        log_date,
        weight_kg ?? null,
        bmiValue,
        body_fat_pct ?? null,
        chest_cm ?? null,
        waist_cm ?? null,
        hips_cm ?? null,
        arms_cm ?? null,
      ]
    );

    res.status(201).json({ message: 'Measurement saved', bmi: bmiValue });
  } catch (err) {
    next(err);
  }
};

export const deleteBodyMetric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM BODY_METRIC WHERE body_metric_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Measurement not found' });
    }
    res.json({ message: 'Measurement deleted' });
  } catch (err) {
    next(err);
  }
};
