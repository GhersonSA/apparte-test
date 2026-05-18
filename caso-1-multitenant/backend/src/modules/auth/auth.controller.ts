import { Request, Response } from "express";

import { AppError } from "../../shared/app-error";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    res.status(200).json(result);
  }

  async me(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const user = await authService.me(req.auth);

    res.status(200).json({ user });
  }

  async register(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const user = await authService.register(req.auth, req.body);

    res.status(201).json({ user });
  }
}
