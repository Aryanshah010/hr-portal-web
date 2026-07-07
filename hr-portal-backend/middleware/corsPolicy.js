import cors from "cors";
import { env } from "../config/environment.js";

export const configureCors = () => {
  const trustedOrigin = env.frontendUrl;

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin === trustedOrigin) {
        callback(null, true);
      } else {
        callback(
          new Error(
            "CORS Policy violation: Request origin is not permitted access.",
          ),
        );
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: ["X-CSRF-Token"],
    credentials: true,
    optionsSuccessStatus: 204,
  };

  return cors(corsOptions);
};
