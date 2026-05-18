import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler";
import { authRouter } from "./modules/auth/auth.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN
    })
  );
  app.use(express.json());

  app.use("/api/auth", authRouter);

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
