require("dotenv").config();
const pool = require("../config/db");

async function insertNewUser(user_id, email, username) {
  const result = await pool.query(
    "INSERT INTO users (id, email, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
    [user_id, email, username]
  );
} 

async function insertGroup(name, created_by) {
  const result = await pool.query(
    "INSERT INTO groups (name, created_by, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [name, created_by]
  );
  return result.rows[0];
}

async function insertMember(group_id, user_id) {
  await pool.query(
    "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [group_id, user_id]
  );
}

async function insertMessage(group_id, sender_id, content) {
  const result = await pool.query(
    "INSERT INTO group_messages (group_id, sender_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [group_id, sender_id, content]
  );
  return result.rows[0];
}

async function fetchMessages(group_id) {
  const result = await pool.query(
    "SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC",
    [group_id]
  );
  return result.rows;
}

async function fetchMembers(group_id) {
  const result = await pool.query(
    "SELECT user_id FROM group_members WHERE group_id = $1",
    [group_id]
  );
  return result.rows || [];
}

module.exports = { insertGroup, insertMember, insertMessage, fetchMessages, insertNewUser, fetchMembers };