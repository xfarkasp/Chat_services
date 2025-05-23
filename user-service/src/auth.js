require("dotenv").config();
const jwt = require("jsonwebtoken");

//-------------------------------------------------------------------------------------------------------------

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

//-------------------------------------------------------------------------------------------------------------

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { generateToken, verifyToken };
