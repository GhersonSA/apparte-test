import { InterventionType } from "@prisma/client";
import { z } from "zod";

export const createReportSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(150),
  interventionType: z.nativeEnum(InterventionType)
});

export const reportIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
