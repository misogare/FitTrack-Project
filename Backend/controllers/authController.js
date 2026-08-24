import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { validationResult } from 'express-validator';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const generateToken = (userId) => {
  return jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('fittrack_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password, date_of_birth, gender, height_cm } = req.body;

    const [existing] = await pool.execute('SELECT user_id FROM USER WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in instead.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const [result] = await pool.execute(
      `INSERT INTO USER (first_name, last_name, email, password_hash, date_of_birth, gender, height_cm)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, password_hash, date_of_birth || null, gender || null, height_cm || null]
    );

    const token = generateToken(result.insertId);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        user_id: result.insertId,
        first_name,
        last_name,
        email
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, password_hash FROM USER WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user.user_id);
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { current_password, new_password } = req.body;
    const user_id = req.user.user_id;

    const [rows] = await pool.execute(
      'SELECT password_hash FROM USER WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const password_hash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);
    await pool.execute('UPDATE USER SET password_hash = ? WHERE user_id = ?', [password_hash, user_id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie('fittrack_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
};

export const getProfile = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, date_of_birth, gender, height_cm, weight_kg, created_at 
       FROM USER WHERE user_id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Live counts for the profile avatar card
    const [[wCount], [gCount]] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS total FROM WORKOUT WHERE user_id = ?', [user_id]),
      pool.execute(`SELECT COUNT(*) AS total FROM GOAL WHERE user_id = ? AND status = 'Active'`, [user_id]),
    ]);

    res.json({
      user: {
        ...rows[0],
        workout_count: Number(wCount[0].total),
        active_goal_count: Number(gCount[0].total),
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, date_of_birth, gender, height_cm, weight_kg } = req.body;

    await pool.execute(
      `UPDATE USER SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, height_cm = ?, weight_kg = ?
       WHERE user_id = ?`,
      [first_name, last_name, date_of_birth || null, gender || null, height_cm || null, weight_kg ?? null, req.user.user_id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};