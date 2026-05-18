import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { validateBody } from "../../middlewares/validate-body";
import { asyncHandler } from "../../shared/async-handler";
import { createReportSchema } from "./reports.schemas";
import { ReportsController } from "./reports.controller";

const reportsRouter = Router();
const reportsController = new ReportsController();

reportsRouter.use(authenticate);

reportsRouter.post(
  "/",
  validateBody(createReportSchema),
  asyncHandler((req, res) => reportsController.create(req, res))
);

reportsRouter.get(
  "/",
  asyncHandler((req, res) => reportsController.list(req, res))
);

reportsRouter.get(
  "/stats",
  asyncHandler((req, res) => reportsController.stats(req, res))
);

reportsRouter.get(
  "/:id",
  asyncHandler((req, res) => reportsController.findById(req, res))
);

reportsRouter.delete(
  "/:id",
  asyncHandler((req, res) => reportsController.delete(req, res))
);

export { reportsRouter };
