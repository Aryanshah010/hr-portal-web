import { generateToken } from "./generateToken.js";

export const sendTokenCookie = (user, statusCode, res) => {
  const token = generateToken(user);

  res.cookie("token", token, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    data: { user },
  });
};
