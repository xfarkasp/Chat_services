const { Pool } = require("pg");

let pool;

if (!pool) {
  const { Pool } = require("pg");
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("connect", () => console.log("Connected to PostgreSQL Database"));
}

module.exports = pool;
