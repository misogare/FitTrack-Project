// Run init-db.sql in Railway (the DB already exists, so skip CREATE DATABASE / USE)
import pool from '../config/db.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'init-db.sql'), 'utf8');

// Strip the CREATE DATABASE + USE block — Railway's DB is already provisioned.
// Also remove any orphaned CHARACTER SET / COLLATE lines left from that block.
// Send the rest as a single multi-statement query so no splitting issues.
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

try {
  // query() with multipleStatements needed — execute() is single-statement only
  const conn = await pool.getConnection();
  try {
    await conn.query({ sql: clean, multipleStatements: true });
    console.log('All tables created successfully!');
  } finally {
    conn.release();
  }
} catch (err) {
  if (err.code === 'ER_TABLE_EXISTS') {
    console.log('Tables already exist (skipping).');
  } else {
    console.error(`Failed: ${err.message}`);
    throw err;
  }
}
process.exit(0);