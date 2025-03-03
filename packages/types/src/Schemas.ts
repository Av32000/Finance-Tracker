import { z } from "zod";
import {
  ChartAvailableFieldsEnum,
  ChartTypeEnum,
  TransactionsFilterSchema,
} from "./charts";

const SettingSchema = z.object({
  name: z.string(),
  value: z.any().nullish(),
});

const TransactionTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

const TransactionSchema = z.object({
  id: z.string(),
  created_at: z.number(),
  name: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.number(),
  tag: z.string(),
  file: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .or(z.null()),
});

// Charts
const ChartDataBuilderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["bar", "pie", "radial", "line"]),
  groupBy: ChartAvailableFieldsEnum,
  filters: z.array(TransactionsFilterSchema),
  metrics: z.array(
    z.object({
      field: z.enum(["amount", "balance", "count"]),
      function: z.enum(["sum", "average", "count", "void"]),
      cumulative: z.boolean(),
    })
  ),
});

const ChartSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ChartTypeEnum,
  transactionsFilters: z.array(z.null()),
  dataBuilderConfig: ChartDataBuilderConfigSchema,
});

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
  transactions: z.array(TransactionSchema),
  monthly: z.number(),
  currentMonthly: z.number(),
  settings: z.array(SettingSchema),
  tags: z.array(TransactionTagSchema),
  charts: z.array(z.null()),
});

const AccountsSchema = z.array(AccountSchema);

export {
  AccountSchema,
  AccountsSchema,
  ChartDataBuilderConfigSchema,
  ChartSchema,
  SettingSchema,
  TransactionSchema,
  TransactionTagSchema,
};
