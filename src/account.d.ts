import { z } from 'zod';
import {
	AccountSchema,
	SettingSchema,
	TransactionSchema,
	TransactionTagSchema,
} from './Schemas';

type Account = z.infer<typeof AccountSchema>;
type Transaction = z.infer<typeof TransactionSchema>;
type Setting = z.infer<typeof SettingSchema>;
type TransactionTag = z.infer<typeof TransactionTagSchema>;

type ChartFrequency = 'Days' | 'Weeks' | 'Months' | 'Years'

export { Account, Transaction, TransactionTag, ChartFrequency };
