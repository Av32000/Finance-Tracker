import { z } from "zod";
import { ChartDataBuilderConfigSchema, ChartSchema } from "./Schemas";

export const ChartTypeEnum = z.enum(["Pie", "Line"]);
export type ChartType = z.infer<typeof ChartTypeEnum>;

export const ChartAvailableFieldsEnum = z.enum([
  "name",
  "amount",
  "date",
  "hour",
  "day",
  "month",
  "year",
  "tag",
]);
export type ChartAvailableFields = z.infer<typeof ChartAvailableFieldsEnum>;

export const TransactionsFilterSchema = z
  .object({
    type: z.literal("property"),
    field: ChartAvailableFieldsEnum,
    operator: z.enum([
      "equals",
      "greater_than",
      "less_than",
      "between",
      "contains",
    ]),
    value: z.any(),
  })
  .or(
    z.object({
      type: z.literal("sort"),
      field: ChartAvailableFieldsEnum,
      order: z.enum(["asc", "desc"]),
      limit: z.number().optional(),
    })
  );
export type TransactionsFilter = z.infer<typeof TransactionsFilterSchema>;

export type FTChart = z.infer<typeof ChartSchema>;
export type ChartDataBuilderConfig = z.infer<
  typeof ChartDataBuilderConfigSchema
>;
