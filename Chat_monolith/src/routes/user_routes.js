const {
  registerUser,
  loginUser,
} = require("../controllers/user_controller");

// Register a new user
router.post("/api/users/register", registerUser);

// Login user
router.post("/api/users/login", loginUser);

module.exports = router;
