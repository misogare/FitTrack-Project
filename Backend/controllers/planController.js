import pool from '../config/db.js';
import { validationResult } from 'express-validator';

// GET /plans — all plans for the current user (with progress)
export const getPlans = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    const [rows] = await pool.execute(
      `SELECT
         p.plan_id,
         p.plan_name,
         p.description,
         p.difficulty,
         p.duration_weeks,
         p.status,
         p.created_at,
         (SELECT COUNT(*) FROM WORKOUT_PLAN_ITEM pi WHERE pi.plan_id = p.plan_id) AS total_sessions,
         (SELECT COUNT(*) FROM WORKOUT w
            WHERE w.plan_id = p.plan_id AND w.user_id = ?) AS completed_sessions
       FROM WORKOUT_PLAN p
       WHERE p.user_id = ?
       ORDER BY
         CASE p.status WHEN 'Active' THEN 0 WHEN 'Paused' THEN 1
                       WHEN 'Draft' THEN 2 ELSE 3 END,
         p.created_at DESC`,
      [user_id, user_id]
    );

    res.json({ plans: rows });
  } catch (err) {
    next(err);
  }
};

// GET /plans/active — the current user's active plan with items + exercises
export const getActivePlan = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    const [plans] = await pool.execute(
      `SELECT * FROM WORKOUT_PLAN
       WHERE user_id = ? AND status = 'Active'
       LIMIT 1`,
      [user_id]
    );

    if (!plans.length) {
      return res.json({ active: null });
    }

    const plan = plans[0];

    const [items] = await pool.execute(
      `SELECT
         pi.*,
         (SELECT COUNT(*) FROM WORKOUT w
            WHERE w.plan_item_id = pi.plan_item_id AND w.user_id = ?) AS is_completed
       FROM WORKOUT_PLAN_ITEM pi
       WHERE pi.plan_id = ?
       ORDER BY pi.day_number ASC`,
      [user_id, plan.plan_id]
    );

    // Load exercises per item
    const [exercises] = await pool.execute(
      `SELECT * FROM PLAN_EXERCISE
       WHERE plan_item_id IN (${items.map(() => '?').join(',') || 'NULL'})
       ORDER BY sort_order ASC`,
      items.map(i => i.plan_item_id)
    );

    const itemsWithExercises = items.map(item => ({
      ...item,
      exercises: exercises.filter(e => e.plan_item_id === item.plan_item_id),
    }));

    const totalSessions = items.length;
    const completedSessions = items.filter(i => i.is_completed).length;

    res.json({
      active: {
        ...plan,
        items: itemsWithExercises,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        percent_complete: totalSessions
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /plans/:id — one plan with all items + exercises
export const getPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [plans] = await pool.execute(
      `SELECT * FROM WORKOUT_PLAN WHERE plan_id = ? AND user_id = ?`,
      [id, user_id]
    );
    if (!plans.length) return res.status(404).json({ message: 'Plan not found' });

    const [items] = await pool.execute(
      `SELECT * FROM WORKOUT_PLAN_ITEM WHERE plan_id = ? ORDER BY day_number ASC`,
      [id]
    );

    let itemsWithExercises = items;
    if (items.length) {
      const [exercises] = await pool.execute(
        `SELECT * FROM PLAN_EXERCISE
         WHERE plan_item_id IN (${items.map(() => '?').join(',')})
         ORDER BY sort_order ASC`,
        items.map(i => i.plan_item_id)
      );
      itemsWithExercises = items.map(item => ({
        ...item,
        exercises: exercises.filter(e => e.plan_item_id === item.plan_item_id),
      }));
    }

    res.json({ plan: { ...plans[0], items: itemsWithExercises } });
  } catch (err) {
    next(err);
  }
};

// POST /plans — create a plan
export const createPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { plan_name, description, difficulty, duration_weeks, status = 'Draft', items = [] } = req.body;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      `INSERT INTO WORKOUT_PLAN (user_id, plan_name, description, difficulty, duration_weeks, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, plan_name, description || null, difficulty || null, duration_weeks || null, status]
    );

    const plan_id = result.insertId;

    for (const item of items) {
      const [itemRes] = await pool.execute(
        `INSERT INTO WORKOUT_PLAN_ITEM
           (plan_id, activity_name, activity_type, target_duration_minutes, target_intensity, day_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [plan_id, item.activity_name, item.activity_type, item.target_duration_minutes || null,
         item.target_intensity || null, item.day_number]
      );
      const plan_item_id = itemRes.insertId;

      if (Array.isArray(item.exercises)) {
        for (let i = 0; i < item.exercises.length; i++) {
          const ex = item.exercises[i];
          await pool.execute(
            `INSERT INTO PLAN_EXERCISE
               (plan_item_id, name, category, muscle_group, sets, reps, weight_kg, rest_seconds, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [plan_item_id, ex.name, ex.category || null, ex.muscle_group || null,
             ex.sets || null, ex.reps || null, ex.weight_kg || null,
             ex.rest_seconds || null, i]
          );
        }
      }
    }

    res.status(201).json({ message: 'Plan created', plan_id });
  } catch (err) {
    next(err);
  }
};

// PATCH /plans/:id/activate — set as Active (deactivate others first)
export const activatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    await pool.execute(
      `UPDATE WORKOUT_PLAN SET status = 'Paused'
       WHERE user_id = ? AND status = 'Active'`,
      [user_id]
    );

    const [result] = await pool.execute(
      `UPDATE WORKOUT_PLAN SET status = 'Active'
       WHERE plan_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Plan not found' });

    res.json({ message: 'Plan activated' });
  } catch (err) {
    next(err);
  }
};

// PATCH /plans/:id/status — generic status update (Paused, Completed, Draft)
export const updatePlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id;

    if (!['Active', 'Paused', 'Completed', 'Draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If activating, pause everything else first
    if (status === 'Active') {
      await pool.execute(
        `UPDATE WORKOUT_PLAN SET status = 'Paused'
         WHERE user_id = ? AND status = 'Active'`,
        [user_id]
      );
    }

    const [result] = await pool.execute(
      `UPDATE WORKOUT_PLAN SET status = ?
       WHERE plan_id = ? AND user_id = ?`,
      [status, id, user_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Plan not found' });

    res.json({ message: 'Plan status updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /plans/:id
export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute(
      'DELETE FROM WORKOUT_PLAN WHERE plan_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /plans/:planItemId/start — log a workout for the given plan item
export const startWorkout = async (req, res, next) => {
  try {
    const { planItemId } = req.params;
    const user_id = req.user.user_id;

    const [items] = await pool.execute(
      `SELECT pi.*, p.user_id
       FROM WORKOUT_PLAN_ITEM pi
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pi.plan_item_id = ?`,
      [planItemId]
    );

    if (!items.length || items[0].user_id !== user_id) {
      return res.status(404).json({ message: 'Plan item not found' });
    }

    const item = items[0];

    const [result] = await pool.execute(
      `INSERT INTO WORKOUT
         (user_id, plan_id, plan_item_id, activity_name, workout_type,
          duration_minutes, intensity, calories_burned, workout_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [user_id, item.plan_id, item.plan_item_id, item.activity_name,
       item.activity_type, item.target_duration_minutes || 30,
       item.target_intensity || 'Medium', null,
       req.body.notes || null]
    );

    res.status(201).json({
      message: 'Workout started',
      workout_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

// GET /plans/:id/stats — aggregate stats for the plan
export const getPlanStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [stats] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM WORKOUT_PLAN_ITEM WHERE plan_id = ?) AS total_sessions,
         COALESCE((SELECT COUNT(*) FROM WORKOUT WHERE plan_id = ? AND user_id = ?), 0) AS completed_sessions,
         COALESCE((SELECT AVG(duration_minutes) FROM WORKOUT WHERE plan_id = ? AND user_id = ?), 0) AS avg_duration,
         COALESCE((SELECT SUM(calories_burned) FROM WORKOUT WHERE plan_id = ? AND user_id = ?), 0) AS total_calories,
         (SELECT DATEDIFF(
            DATE_ADD(created_at, INTERVAL duration_weeks WEEK),
            CURDATE())
          FROM WORKOUT_PLAN WHERE plan_id = ?) AS days_remaining`,
      [id, id, user_id, id, user_id, id, user_id, id]
    );

    res.json({ stats: stats[0] || {} });
  } catch (err) {
    next(err);
  }
};
// GET /plans/:planItemId/exercises — list exercises in a session
export const getPlanExercises = async (req, res, next) => {
  try {
    const { planItemId } = req.params;
    const user_id = req.user.user_id;

    const [items] = await pool.execute(
      `SELECT pi.plan_item_id, p.user_id
       FROM WORKOUT_PLAN_ITEM pi
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pi.plan_item_id = ?`,
      [planItemId]
    );
    if (!items.length || items[0].user_id !== user_id) {
      return res.status(404).json({ message: 'Plan item not found' });
    }

    const [rows] = await pool.execute(
      `SELECT
         pe.plan_exercise_id,
         pe.plan_item_id,
         pe.sets,
         pe.reps,
         pe.weight_kg,
         pe.rest_seconds,
         pe.sort_order,
         e.exercise_id,
         e.name,
         e.category,
         e.muscle_group,
         e.equipment
       FROM PLAN_EXERCISE pe
       JOIN EXERCISE e ON pe.exercise_id = e.exercise_id
       WHERE pe.plan_item_id = ?
       ORDER BY pe.sort_order ASC`,
      [planItemId]
    );

    res.json({ exercises: rows });
  } catch (err) {
    next(err);
  }
};

// POST /plans/:planItemId/exercises — add an exercise to a session
export const addPlanExercise = async (req, res, next) => {
  try {
    const { planItemId } = req.params;
    const { exercise_id, sets, reps, weight_kg, rest_seconds } = req.body;
    const user_id = req.user.user_id;

    const [items] = await pool.execute(
      `SELECT pi.plan_item_id, p.user_id
       FROM WORKOUT_PLAN_ITEM pi
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pi.plan_item_id = ?`,
      [planItemId]
    );
    if (!items.length || items[0].user_id !== user_id) {
      return res.status(404).json({ message: 'Plan item not found' });
    }

    const [maxRow] = await pool.execute(
      'SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM PLAN_EXERCISE WHERE plan_item_id = ?',
      [planItemId]
    );
    const nextOrder = (maxRow[0]?.max_order ?? -1) + 1;

    const [result] = await pool.execute(
      `INSERT INTO PLAN_EXERCISE
         (plan_item_id, exercise_id, sets, reps, weight_kg, rest_seconds, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [planItemId, exercise_id, sets ?? null, reps ?? null,
       weight_kg ?? null, rest_seconds ?? null, nextOrder]
    );

    res.status(201).json({
      message: 'Exercise added',
      plan_exercise_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /plan-exercises/:id — inline edit sets/reps/weight
export const updatePlanExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [rows] = await pool.execute(
      `SELECT pe.plan_exercise_id
       FROM PLAN_EXERCISE pe
       JOIN WORKOUT_PLAN_ITEM pi ON pe.plan_item_id = pi.plan_item_id
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pe.plan_exercise_id = ? AND p.user_id = ?`,
      [id, user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Exercise not found' });

    const { sets, reps, weight_kg, rest_seconds, sort_order } = req.body;

    const [result] = await pool.execute(
      `UPDATE PLAN_EXERCISE
       SET
         sets = ?,
         reps = ?,
         weight_kg = ?,
         rest_seconds = ?,
         sort_order = COALESCE(?, sort_order)
       WHERE plan_exercise_id = ?`,
      [sets ?? null, reps ?? null, weight_kg ?? null,
       rest_seconds ?? null, sort_order ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json({ message: 'Exercise updated' });
  } catch (err) {
    next(err);
  }
};

// PATCH /plan-exercises/:id/swap — swap exercise for one from the library
export const swapPlanExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exercise_id } = req.body;
    const user_id = req.user.user_id;

    if (!exercise_id) {
      return res.status(400).json({ message: 'exercise_id is required' });
    }

    const [rows] = await pool.execute(
      `SELECT pe.plan_exercise_id
       FROM PLAN_EXERCISE pe
       JOIN WORKOUT_PLAN_ITEM pi ON pe.plan_item_id = pi.plan_item_id
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pe.plan_exercise_id = ? AND p.user_id = ?`,
      [id, user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Exercise not found' });

    const [result] = await pool.execute(
      'UPDATE PLAN_EXERCISE SET exercise_id = ? WHERE plan_exercise_id = ?',
      [exercise_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json({ message: 'Exercise swapped' });
  } catch (err) {
    next(err);
  }
};

// DELETE /plan-exercises/:id
export const deletePlanExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [rows] = await pool.execute(
      `SELECT pe.plan_exercise_id
       FROM PLAN_EXERCISE pe
       JOIN WORKOUT_PLAN_ITEM pi ON pe.plan_item_id = pi.plan_item_id
       JOIN WORKOUT_PLAN p ON pi.plan_id = p.plan_id
       WHERE pe.plan_exercise_id = ? AND p.user_id = ?`,
      [id, user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Exercise not found' });

    await pool.execute(
      'DELETE FROM PLAN_EXERCISE WHERE plan_exercise_id = ?',
      [id]
    );

    res.json({ message: 'Exercise removed' });
  } catch (err) {
    next(err);
  }
};

// PUT /plans/:id — update plan metadata
export const updatePlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const user_id = req.user.user_id;
    const { plan_name, description, difficulty, duration_weeks } = req.body;

    const [result] = await pool.execute(
      `UPDATE WORKOUT_PLAN
       SET plan_name = ?, description = ?, difficulty = ?, duration_weeks = ?
       WHERE plan_id = ? AND user_id = ?`,
      [plan_name, description || null, difficulty || null,
       duration_weeks || null, id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ message: 'Plan updated' });
  } catch (err) {
    next(err);
  }
};