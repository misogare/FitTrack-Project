import pool from '../config/db.js';

// GET /exercises — list the library (optional ?muscle_group= or ?q= filter)
export const getExercises = async (req, res, next) => {
  try {
    const { muscle_group, q } = req.query;
    const params = [];
    let where = '1=1';

    if (muscle_group && muscle_group !== 'All') {
      where += ' AND muscle_group = ?';
      params.push(muscle_group);
    }
    if (q) {
      where += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    const [rows] = await pool.execute(
      `SELECT exercise_id, name, category, muscle_group, equipment
       FROM EXERCISE
       WHERE ${where}
       ORDER BY name ASC
       LIMIT 100`,
      params
    );

    res.json({ exercises: rows });
  } catch (err) {
    next(err);
  }
};

// GET /exercises/muscle-groups — list of distinct muscle groups for filter dropdown
export const getMuscleGroups = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT muscle_group
       FROM EXERCISE
       ORDER BY muscle_group ASC`
    );
    res.json({ muscle_groups: rows.map(r => r.muscle_group) });
  } catch (err) {
    next(err);
  }
};