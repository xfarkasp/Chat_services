require("dotenv").config({ path: "../.env" });
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const SALT_ROUNDS = 10;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on("connect", () => console.log("Connected to PostgreSQL Database"));

//-------------------------------------------------------------------------------------------------------------

async function insertNewUserInDb(username, email, password) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
    [username, email, hashedPassword]
  );
  return result.rows[0];
}

//-------------------------------------------------------------------------------------------------------------

async function findUserInDbByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
}

//-------------------------------------------------------------------------------------------------------------

async function findUserInDbById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  insertNewUserInDb,
  findUserInDbByEmail,
  findUserInDbById,
  pool,
};
