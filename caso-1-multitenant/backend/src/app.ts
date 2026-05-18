import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { reportsRouter } from "./modules/reports/reports.routes";

export function createApp() {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    })
  );
  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/reports", reportsRouter);

  app.get("/api/health", (_req, res) => {
    res.json({
      service: "case1-backend",
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("*", (_req, res) => {
    res.status(404).json({
      message: "Route not found"
    });
  });

  app.use(errorHandler);

  return app;
}
