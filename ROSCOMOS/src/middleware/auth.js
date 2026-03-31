const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ success: false, error: { message: "Token required" } });
  try {
    const decoded = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
    req.user = { id: decoded.sub, walletAddress: decoded.walletAddress, role: decoded.role || "user" };
    next();
  } catch (e) {
    res.status(401).json({ success: false, error: { message: e.name === "TokenExpiredError" ? "Token expired" : "Invalid token" } });
  }
});

const generateToken = p => jwt.sign({ walletAddress: p.walletAddress, role: p.role }, process.env.JWT_SECRET, { expiresIn: "7d", subject: p.id });
module.exports = { authenticate, generateToken };
