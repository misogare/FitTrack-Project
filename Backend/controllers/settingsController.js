import pool from '../config/db.js';
import { validationResult } from 'express-validator';

const DEFAULTS = {
  daily_step_goal: 10000,
  daily_workout_minutes: 60,
  daily_calorie_burn_goal: 500,
  daily_hydration_litres: 2.5,
  research_data_sharing: false,
  email_reminders: true,
  public_profile_visibility: false,
};

const numOr = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

async function getSettingsRow(user_id) {
  const [rows] = await pool.execute(
    `SELECT daily_step_goal, daily_workout_minutes, daily_calorie_burn_goal,
            daily_hydration_litres, research_data_sharing, email_reminders,
            public_profile_visibility, prefs_json
     FROM SETTINGS WHERE user_id = ?`,
    [user_id]
  );
  const row = rows[0] || {};
  let prefs = {};
  try { prefs = row.prefs_json ? JSON.parse(row.prefs_json) : {}; } catch { prefs = {}; }
  return {
    daily_step_goal: numOr(row.daily_step_goal, DEFAULTS.daily_step_goal),
    daily_workout_minutes: numOr(row.daily_workout_minutes, DEFAULTS.daily_workout_minutes),
    daily_calorie_burn_goal: numOr(row.daily_calorie_burn_goal, DEFAULTS.daily_calorie_burn_goal),
    daily_hydration_litres: numOr(row.daily_hydration_litres, DEFAULTS.daily_hydration_litres),
    research_data_sharing: row.research_data_sharing ? Boolean(Number(row.research_data_sharing)) : false,
    email_reminders: row.email_reminders ? Boolean(Number(row.email_reminders)) : false,
    public_profile_visibility: row.public_profile_visibility ? Boolean(Number(row.public_profile_visibility)) : false,
    prefs: prefs,
  };
}

export const getSettings = async (req, res, next) => {
  try {
    res.json({ settings: await getSettingsRow(req.user.user_id) });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user_id = req.user.user_id;
    const body = req.body || {};

    // Ensure a settings row exists.
    await pool.execute(
      `INSERT INTO SETTINGS (user_id) VALUES (?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [user_id]
    );

    const updates = [];
    const params = [];

    const numericFields = [
      ['daily_step_goal', 'daily_step_goal'],
      ['daily_workout_minutes', 'daily_workout_minutes'],
      ['daily_calorie_burn_goal', 'daily_calorie_burn_goal'],
      ['daily_hydration_litres', 'daily_hydration_litres'],
    ];
    for (const [field, column] of numericFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        updates.push(`${column} = ?`);
        params.push(Number(body[field]));
      }
    }

    const boolFields = [
      ['research_data_sharing', 'research_data_sharing'],
      ['email_reminders', 'email_reminders'],
      ['public_profile_visibility', 'public_profile_visibility'],
    ];
    for (const [field, column] of boolFields) {
      if (typeof body[field] === 'boolean') {
        updates.push(`${column} = ?`);
        params.push(body[field] ? 1 : 0);
      }
    }

    // Granular prefs (sharing toggles + notification prefs) as JSON.
    if (body.prefs && typeof body.prefs === 'object') {
      const current = await getSettingsRow(user_id);
      const merged = { ...(current.prefs || {}), ...body.prefs };
      updates.push('prefs_json = ?');
      params.push(JSON.stringify(merged));
    }

    if (updates.length > 0) {
      params.push(user_id);
      await pool.execute(`UPDATE SETTINGS SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }

    res.json({ message: 'Settings updated', settings: await getSettingsRow(user_id) });
  } catch (err) {
    next(err);
  }
};
