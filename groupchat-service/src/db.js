require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on("connect", () => console.log("Connected to PostgreSQL Database"));

//-------------------------------------------------------------------------------------------------------------

async function insertNewUser(user_id, email, username) {
  const result = await pool.query(
    "INSERT INTO users (id, email, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
    [user_id, email, username]
  );
}

//-------------------------------------------------------------------------------------------------------------

async function insertGroup(name, created_by) {
  const result = await pool.query(
    "INSERT INTO groups (name, created_by, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [name, created_by]
  );
  return result.rows[0];
}

//-------------------------------------------------------------------------------------------------------------

async function insertMember(group_id, user_id) {
  await pool.query(
    "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [group_id, user_id]
  );
}

//-------------------------------------------------------------------------------------------------------------

async function insertMessage(group_id, sender_id, content, mediaUrl) {
  const result = await pool.query(
    "INSERT INTO group_messages (group_id, sender_id, content, media_url,created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
    [group_id, sender_id, content, mediaUrl]
  );
  return result.rows[0];
}

//-------------------------------------------------------------------------------------------------------------

async function fetchMessages(group_id) {
  const result = await pool.query(
    `
    SELECT * FROM
     (SELECT 
        gm.id,
        sender.username AS sender_username,
        gm.sender_id,
        gm.content,
        gm.created_at
      FROM group_messages gm
      JOIN users sender ON gm.sender_id = sender.id
      WHERE gm.group_id = $1
      ORDER BY gm.created_at DESC
      LIMIT 10)
      sub ORDER BY created_at ASC;
    `,
    [group_id]
  );
  return result.rows;
}

//-------------------------------------------------------------------------------------------------------------

async function fetchMembers(group_id) {
  const result = await pool.query(
    "SELECT user_id FROM group_members WHERE group_id = $1",
    [group_id]
  );
  return result.rows || [];
}

//-------------------------------------------------------------------------------------------------------------

async function fetchAssociatedGroups(userId) {
  const result = await pool.query(
    `
      SELECT g.id, g.name
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1;
    `,
    [userId]
  );
  return result.rows || [];
}

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  insertGroup,
  insertMember,
  insertMessage,
  fetchMessages,
  insertNewUser,
  fetchMembers,
  fetchAssociatedGroups,
  pool,
};
