// Run init-db.sql on Railway — strips CREATE DATABASE/USE and inline comments
import pool from '../config/db.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'init-db.sql'), 'utf8');

// 1) Strip the CREATE DATABASE / USE block + orphaned charset lines
// 2) Strip all inline -- comments (their semicolons break multipleStatements)
// 3) Send as a single multi-statement query
const clean = sql
  .split('\n')
  .filter(line => {
    const t = line.trim().toUpperCase();
    if (t.startsWith('CREATE DATABASE')) return false;
    if (t.startsWith('USE ')) return false;
    if (t === 'CHARACTER SET UTF8MB4') return false;
    if (t === 'COLLATE UTF8MB4_UNICODE_CI;') return false;
    return true;
  })
  // Remove inline -- comments (they contain semicolons that confuse mysql2's multi-statement parser)
  .map(line => line.replace(/--.*$/, ''))
  .join('\n')
  .trim();

console.log('Running schema...');

const conn = await pool.getConnection();
try {
  await conn.query({ sql: clean, multipleStatements: true });
  console.log('All tables created successfully!');
} finally {
  conn.release();
}

process.exit(0);