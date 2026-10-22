const mysql = require('mysql2/promise');
const { querySqlite, runSqlite, initSqliteSchemaAndSeed, getSqliteDb } = require('./sqliteAdapter');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'newcomer_marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  decimalNumbers: true
};

let pool = null;
let useFallback = false;

try {
  pool = mysql.createPool(poolConfig);
} catch (err) {
  console.warn('[DB] MySQL pool initialization deferred. Fallback adapter ready.');
  useFallback = true;
}

// Test connectivity on startup
async function testConnection() {
  if (useFallback) {
    await initSqliteSchemaAndSeed();
    console.log('[DB] Running with local SQLite database engine (zero-config mode).');
    return false;
  }

  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Successfully connected to live MySQL (${poolConfig.host}:${poolConfig.port}/${poolConfig.database})`);
    connection.release();
    return true;
  } catch (err) {
    useFallback = true;
    console.warn(`[DB] MySQL connection notice (${err.code || err.message}).`);
    console.log('[DB] Activating local zero-config database mode with full seed dataset.');
    await initSqliteSchemaAndSeed();
    console.log('[DB] Seed dataset active. (To use MySQL instead, set DB_PASSWORD in backend/.env)');
    return false;
  }
}

async function query(sql, params = []) {
  if (useFallback) {
    return await querySqlite(sql, params);
  }
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
      useFallback = true;
      await initSqliteSchemaAndSeed();
      return await querySqlite(sql, params);
    }
    throw err;
  }
}

async function execute(sql, params = []) {
  if (useFallback) {
    return await runSqlite(sql, params);
  }
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
      useFallback = true;
      await initSqliteSchemaAndSeed();
      return await runSqlite(sql, params);
    }
    throw err;
  }
}

// Connection mock / transaction wrapper
const poolWrapper = {
  async getConnection() {
    if (useFallback) {
      return {
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        async query(sql, params) {
          const rows = await querySqlite(sql, params);
          return [rows];
        },
        release() {}
      };
    }
    try {
      return await pool.getConnection();
    } catch (err) {
      useFallback = true;
      await initSqliteSchemaAndSeed();
      return {
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        async query(sql, params) {
          const rows = await querySqlite(sql, params);
          return [rows];
        },
        release() {}
      };
    }
  }
};

module.exports = {
  pool: poolWrapper,
  query,
  execute,
  testConnection,
  poolConfig,
  isUsingFallback: () => useFallback
};
