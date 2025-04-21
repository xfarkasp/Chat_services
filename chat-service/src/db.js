const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => console.log("Connected to PostgreSQL Database"));

module.exports = pool;