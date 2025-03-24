const bcrypt = require("bcrypt");
const pool = require("./db");
const { redisClient } = require("./redis_client");
const { generateToken } = require("./auth");

const SALT_ROUNDS = 10;

// Register a new user
async function registerUser(username, email, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error("Error registering user: " + error.message);
  }
}

// User login and token generation
async function loginUser(email, password) {
  try {
    
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log("after result");
    const user = result.rows[0];
    
    if (!user) {
      throw new Error("User not found");
    }

    // Ensure the password is a string
    if (typeof user.password !== "string" || typeof password !== "string") {
      throw new Error("Password must be a valid string");
    }

    // Verify hashed password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user);
    return { user, token };
  } catch (error) {
    console.error("Login failed:", error.message);
    throw new Error("Login failed: " + error.message);
  }
}

// Mark user as online
async function setUserOnline(userId) {
  await redisClient.set(`user:${userId}`, "online");
  await pool.query("UPDATE users SET status = $1 WHERE id = $2", ["online", userId]);
}

// Mark user as offline
async function setUserOffline(userId) {
  await redisClient.del(`user:${userId}`);
  await pool.query("UPDATE users SET status = $1 WHERE id = $2", ["offline", userId]);
}

// Check user's online/offline status
async function getUserStatus(userId) {
  const status = await redisClient.get(`user:${userId}`);
  return status ? "online" : "offline";
}

module.exports = {
  registerUser,
  loginUser,
  setUserOnline,
  setUserOffline,
  getUserStatus,
};
