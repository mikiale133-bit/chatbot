import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Fix typo: authorization
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // 2. Fix split: index [1] is the token
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      // Move to next middleware
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ msg: "Not Authorized, Token Failed" });
    }
  }

  // 3. IMPORTANT: Handle the case where no token is provided at all
  if (!token) {
    return res.status(401).json({ msg: "Not authorized, no token provided" });
  }
};

// Verify if the authenticated user is an administrator
export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. This page is only allowed for Admins." });
  }
};
