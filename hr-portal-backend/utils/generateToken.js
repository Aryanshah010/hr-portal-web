import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: "30d" },
  );
};
