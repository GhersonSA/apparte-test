import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/require-role";
import { validateBody } from "../../middlewares/validate-body";
import { asyncHandler } from "../../shared/async-handler";
import { AuthController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";

const authController = new AuthController();
const authRouter = Router();

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler((req, res) => authController.login(req, res))
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler((req, res) => authController.me(req, res))
);

authRouter.post(
  "/register",
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(registerSchema),
  asyncHandler((req, res) => authController.register(req, res))
);

export { authRouter };
