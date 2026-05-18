import { Request, Response } from "express";

import { AppError } from "../../shared/app-error";
import { reportIdParamsSchema } from "./reports.schemas";
import { ReportsService } from "./reports.service";

const reportsService = new ReportsService();

export class ReportsController {
  async create(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const report = await reportsService.create(req.auth, req.body);

    res.status(201).json({ report });
  }

  async list(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const reports = await reportsService.list(req.auth);

    res.status(200).json({ reports });
  }

  async findById(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const { id } = reportIdParamsSchema.parse(req.params);
    const report = await reportsService.findById(req.auth, id);

    res.status(200).json({ report });
  }

  async stats(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const stats = await reportsService.getStats(req.auth);

    res.status(200).json(stats);
  }

  async delete(req: Request, res: Response) {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const { id } = reportIdParamsSchema.parse(req.params);
    await reportsService.delete(req.auth, id);

    res.status(204).send();
  }
}
