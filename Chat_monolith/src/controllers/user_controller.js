const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateToken } = require("../config/auth");

const SALT_ROUNDS = 10;

async function registerUser(req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
  
    try {

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
          "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
          [username, email, hashedPassword]
        );
        const newUser =  result.rows[0];
  
      res.status(201).json({ message: "User registered", user: newUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async function loginUser(req, res) {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
  
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);  
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

        res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

module.exports = {
  registerUser,
  loginUser
};
