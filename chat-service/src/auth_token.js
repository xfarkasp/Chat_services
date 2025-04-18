const jwt = require("jsonwebtoken");

//-------------------------------------------------------------------------------------------------------------

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Access denied, no token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log("midlewear working correctly");
    if (err) {
      return res.status(403).json({ error: "Invalid token." });
    }
    req.user = user;
    console.log(req.user);
    next();
  });
}

//-------------------------------------------------------------------------------------------------------------


module.exports = authenticateToken;
