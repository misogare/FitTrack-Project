// Run init-db.sql in Railway (the DB already exists, so skip CREATE DATABASE / USE)
import pool from '../config/db.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = readFileSync(join(__dirname, '..', 'init-db.sql'), 'utf8');

// Strip the CREATE DATABASE / USE lines — Railway's DB is already provisioned
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE '));

console.log(`Found ${statements.length} SQL statements to execute...`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    await pool.execute(stmt);
    // Print first 60 chars to show progress
    const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 70);
    console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS') {
      console.log(`  [${i + 1}/${statements.length}] (table already exists, skipping)`);
    } else {
      console.error(`  [${i + 1}/${statements.length}] FAILED: ${err.message}`);
      throw err;
    }
  }
}

console.log('\nAll tables created successfully!');
process.exit(0);