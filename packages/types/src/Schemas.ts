import { z } from "zod";
import {
  ChartAvailableFieldsEnum,
  ChartMetricSchema,
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
  tags: z.array(z.string()),
  file: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .or(z.null()),
});

// Charts
const ChartDataBuilderConfigSchema = z.object({
  groupBy: ChartAvailableFieldsEnum,
  filters: z.array(TransactionsFilterSchema),
  metrics: z.array(ChartMetricSchema),
});

const ChartDatasetSchema = z.object({
  data: z.array(z.number()),
  label: z.string(),
  backgroundColor: z.array(z.string()),
  borderColor: z.array(z.string()),
});

const ChartSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ChartTypeEnum,
  dataBuilderConfig: ChartDataBuilderConfigSchema,
});

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
  transactions: z.array(TransactionSchema),
  monthly: z.number(),
  charts: z.array(ChartSchema),
  currentMonthly: z.number(),
  settings: z.array(SettingSchema),
  tags: z.array(TransactionTagSchema),
});

const AccountsSchema = z.array(AccountSchema);

export {
  AccountSchema,
  AccountsSchema,
  ChartDataBuilderConfigSchema,
  ChartDatasetSchema,
  ChartSchema,
  SettingSchema,
  TransactionSchema,
  TransactionTagSchema,
};
