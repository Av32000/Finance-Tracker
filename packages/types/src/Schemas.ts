import { z } from "zod";
import { ChartType, Filter } from "./DataBuilder";

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

const ChartSchema = z.object({
  id: z.string(),
  title: z.string(),
  filter: z.array(z.custom<Filter>()),
  type: z.custom<ChartType>(),
  options: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
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
  charts: z.array(ChartSchema),
});

const AccountsSchema = z.array(AccountSchema);

export {
  AccountSchema,
  AccountsSchema,
  ChartSchema,
  SettingSchema,
  TransactionSchema,
  TransactionTagSchema,
};
