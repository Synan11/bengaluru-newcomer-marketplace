const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'newcomer_marketplace';

  console.log(`[DB INIT] Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without selecting database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('[DB INIT] Connected. Running schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('[DB INIT] Schema created successfully.');

    console.log('[DB INIT] Running seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await connection.query(seedSql);
    console.log('[DB INIT] Seed data inserted successfully!');

    console.log('\n=============================================');
    console.log(' DATABASE INITIALIZATION COMPLETE');
    console.log(` Database: ${database}`);
    console.log(' Seeded 25 areas, 8 languages, 11 services, 10 users, 6 experts, bookings & reviews.');
    console.log('=============================================\n');

  } catch (err) {
    console.error('[DB INIT ERROR]:', err.message);
    console.error('\nPlease verify DB_PORT and DB_PASSWORD in backend/.env:');
    console.error(`- Current host: ${host}`);
    console.error(`- Current port: ${port}`);
    console.error(`- Current user: ${user}`);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
