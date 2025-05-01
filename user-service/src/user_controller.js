const bcrypt = require("bcrypt");
const { generateToken } = require("./auth");
const { insertNewUserInDb, findUserInDb } = require("./db");
const { publishUserCreatedEvent } = require("./kafka_publisher");

//-------------------------------------------------------------------------------------------------------------

// Register a new user
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }
    const newUser = await insertNewUserInDb(username, email, password);
    console.log(newUser);
    await publishUserCreatedEvent(newUser);
    const token = generateToken(newUser);
    res.status(201).json({ message: "User registered", newUser, token });
  } catch (error) {
    throw new Error("Error registering user: " + error.message);
  }
}

//-------------------------------------------------------------------------------------------------------------

// User login and token generation
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = findUserInDb(email);
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

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  registerUser,
  loginUser,
};
