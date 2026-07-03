import express from "express";
import { env } from "./config/environment.js";
import { connectDatabase } from "./config/db.js";

const app = express();

await connectDatabase();

app.use(express.json());

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(env.port, () => {
  console.log(
    `[SERVER] Portal engine running in [${env.nodeEnv}] mode on secure local port: ${env.port}`,
  );
});
