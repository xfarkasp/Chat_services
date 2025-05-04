const bcrypt = require("bcrypt");
const { generateToken } = require("./auth");
const {
  insertNewUserInDb,
  findUserInDbById,
  findUserInDbByEmail,
} = require("./db");
const { publishUserCreatedEvent } = require("./kafka_publisher");

//-------------------------------------------------------------------------------------------------------------

// Register a new user
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
    console.log(req.body);
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
    console.log(req);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("LOGIN PAYLOAD:", req.body);

    const user = await findUserInDbByEmail(email);
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
    res.status(201).json({ message: "User Logedin", user, token });
  } catch (error) {
    console.error("Login failed:", error.message);
    throw new Error("Login failed: " + error.message);
  }
}

//-------------------------------------------------------------------------------------------------------------

// Find user by username or id
async function findUser(req, res) {
  const requestedUserIdentifier = req.params.identifier;
  console.log(requestedUserIdentifier);

  if (!requestedUserIdentifier) {
    return res.status(400).json({ error: "Username not provided." });
  }

  try {
    let user = null;
    if (!isNaN(requestedUserIdentifier)) {
      user = await findUserInDbById(Number(requestedUserIdentifier));
    } else {
      user = await findUserInDbByEmail(requestedUserIdentifier);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const foundUser = {
      id: user.id,
      username: user.username,
    };

    res.status(201).json({ message: "User found", foundUser });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user." });
  }
}

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  registerUser,
  loginUser,
  findUser,
};
