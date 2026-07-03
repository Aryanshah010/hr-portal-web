// config/db.js
import mongoose from "mongoose";
import { env } from "./environment.js";

export const connectDatabase = async () => {
  try {
    const connectionOptions = {
      autoIndex: env.nodeEnv !== "production", 
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000, 
    };

    const conn = await mongoose.connect(env.mongoUri, connectionOptions);

    console.log(
      `[DATABASE] Secured connection established to host: ${conn.connection.host}`,
    );
  } catch (error) {
    console.error(
      "[DATABASE FATAL] Network connection to the database layer failed.",
    );
    process.exit(1);
  }
};
