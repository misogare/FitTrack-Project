import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides MYSQL_URL; local dev uses DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

// Managed hosts reached via a connection URL (Railway, Aiven, ...) may require
// TLS; local dev never sets these vars so this never affects a raw local MySQL.
const dbUrlNeedsSsl = process.env.DB_SSL !== 'false';

const pool = dbUrl
  ? mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      multipleStatements: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      ssl: dbUrlNeedsSsl ? { rejectUnauthorized: false } : undefined,
    })
  : mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });

export default pool;