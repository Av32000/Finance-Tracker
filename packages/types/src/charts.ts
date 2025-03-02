import { z } from "zod";
import { ChartDataBuilderConfigSchema, ChartSchema } from "./Schemas";

export const ChartTypeEnum = z.enum(["Pie", "Line"]);
export type ChartType = z.infer<typeof ChartTypeEnum>;

export const ChartAvailableFieldsEnum = z.enum([
  "name",
  "amount",
  "hour",
  "day",
  "month",
  "year",
  "tag",
]);
export type ChartAvailableFields = z.infer<typeof ChartAvailableFieldsEnum>;
export type FTChart = z.infer<typeof ChartSchema>;
export type ChartDataBuilderConfig = z.infer<
  typeof ChartDataBuilderConfigSchema
>;
