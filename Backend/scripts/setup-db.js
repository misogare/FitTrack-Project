import pool from '../config/db.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'init-db.sql'), 'utf8');

// Strip CREATE DATABASE / USE / orphaned charset lines
const clean = sql
  .split('\n')
  .filter(line => {
    const trimmed = line.trim().toUpperCase();
    if (trimmed.startsWith('CREATE DATABASE')) return false;
    if (trimmed.startsWith('USE ')) return false;
    if (trimmed === 'CHARACTER SET UTF8MB4') return false;
    if (trimmed === 'COLLATE UTF8MB4_UNICODE_CI;') return false;
    return true;
  })
  .join('\n')
  .trim();

console.log('Running schema...');

const conn = await pool.getConnection();

try {
  // Split into individual statements and execute one by one
  const statements = clean
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';');

  for (const stmt of statements) {
    await conn.query(stmt);
  }

  console.log('All tables created successfully!');
} catch (err) {
  console.error(`Failed: ${err.message}`);
  throw err;
} finally {
  conn.release();
}

process.exit(0);