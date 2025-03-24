require("dotenv").config({ path: "../.env" });
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.CHAT_DB,
  password: process.env.DB_PSWD,
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
