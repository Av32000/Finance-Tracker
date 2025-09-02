import { z } from "zod";
import {
  AccountSchema,
  PeriodicTransactionSchema,
  SettingSchema,
  TransactionSchema,
  TransactionTagSchema,
} from "./Schemas";

type Account = z.infer<typeof AccountSchema>;
type Transaction = z.infer<typeof TransactionSchema>;
type PeriodicTransaction = z.infer<typeof PeriodicTransactionSchema>;
type Setting = z.infer<typeof SettingSchema>;
type TransactionTag = z.infer<typeof TransactionTagSchema>;

type FetchServerType = (
  endpoint: string,
  options?: RequestInit,
) => Promise<Response>;

export {
  Account,
  FetchServerType,
  PeriodicTransaction,
  Setting,
  Transaction,
  TransactionTag,
};
