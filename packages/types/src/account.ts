import { z } from "zod";
import {
  AccountSchema,
  SettingSchema,
  TransactionSchema,
  TransactionTagSchema,
} from "./Schemas";

type Account = z.infer<typeof AccountSchema>;
type Transaction = z.infer<typeof TransactionSchema>;
type Setting = z.infer<typeof SettingSchema>;
type TransactionTag = z.infer<typeof TransactionTagSchema>;

type FetchServerType = (
  endpoint: string,
  options?: RequestInit
) => Promise<Response>;

export { Account, FetchServerType, Setting, Transaction, TransactionTag };
