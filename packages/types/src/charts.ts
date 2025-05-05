import { z } from "zod";
import {
  ChartDataBuilderConfigSchema,
  ChartDatasetSchema,
  ChartSchema,
} from "./Schemas";

export const ChartTypeEnum = z.enum(["Pie", "Line", "Doughnut", "Bar"]);
export type ChartType = z.infer<typeof ChartTypeEnum>;

export const ChartAvailableFieldsEnum = z.enum([
  "id",
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

export const ChartFilterOperatorsEnum = z.enum([
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "between",
  "contains",
]);
export type ChartFilterOperators = z.infer<typeof ChartFilterOperatorsEnum>;

export const TransactionsFilterSchema = z
  .object({
    type: z.literal("property"),
    field: ChartAvailableFieldsEnum,
    operator: ChartFilterOperatorsEnum,
    value: z.any(),
  })
  .or(
    z.object({
      type: z.literal("sort"),
      field: ChartAvailableFieldsEnum,
      order: z.enum(["asc", "desc"]),
      limit: z.number().optional(),
    }),
  );
export type TransactionsFilter = z.infer<typeof TransactionsFilterSchema>;

export const ChartMetricsFieldsEnum = z.enum(["amount", "balance", "count"]);
export const ChartMetricsFunctionsEnum = z.enum([
  "sum",
  "average",
  "count",
  "void",
]);

export const ChartMetricSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  filters: z.array(TransactionsFilterSchema),
  field: ChartMetricsFieldsEnum,
  function: ChartMetricsFunctionsEnum,
  cumulative: z.boolean(),
});
export type ChartMetric = z.infer<typeof ChartMetricSchema>;

export type ChartDataset = z.infer<typeof ChartDatasetSchema>;
export type FTChart = z.infer<typeof ChartSchema>;
export type ChartDataBuilderConfig = z.infer<
  typeof ChartDataBuilderConfigSchema
>;
