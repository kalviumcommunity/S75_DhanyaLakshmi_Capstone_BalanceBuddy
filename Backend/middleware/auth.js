const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET=process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  // Check for token in cookies
  let token = req.cookies.token;
  
  // If not in cookies, check Authorization header
  if (!token && req.headers.authorization) {
    // Format should be "Bearer [token]"
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return res.status(401).json({ message: "No token found" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
