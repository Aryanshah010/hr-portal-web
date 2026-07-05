import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required. Please log in.",
      });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);

      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        status: "fail",
        message: "Session invalid or expired. Please re-authenticate.",
      });
    }
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(500).json({
        status: "error",
        message: "Authorization context missing.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message:
          "Access Denied: You do not possess the required privileges to view this resource.",
      });
    }

    next();
  };
};
