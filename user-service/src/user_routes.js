const express = require("express");
const { connectKafka, publishUserCreatedEvent, producer } = require("./publisher");

const {
  registerUser,
  loginUser,
  setUserOnline,
  setUserOffline,
  getUserStatus,
} = require("./user_controller");

const router = express.Router();

(async () => {
  await connectKafka();
})();

// Register a new user
router.post("/api/users/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  try {
    const newUser = await registerUser(username, email, password);

    if (!producer) {
      return res.status(500).json({ error: "Kafka producer is not available" });
    }
    
    await publishUserCreatedEvent(newUser);
    res.status(201).json({ message: "User registered", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { user, token } = await loginUser(email, password);
    console.log("Received input password type:", typeof password, "Value:", password);
    console.log("Stored user password type:", typeof user.password, "Value:", user.password);
    await setUserOnline(user.id);
    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Set user offline
router.post("/api/users/offline", async (req, res) => {
  const { user_id } = req.body;
  try {
    await setUserOffline(user_id);
    res.status(200).json({ message: "User is now offline" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check user status
router.get("/api/users/status/:user_id", async (req, res) => {
  const userId = req.params.user_id;
  try {
    const status = await getUserStatus(userId);
    res.status(200).json({ user_id: userId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
