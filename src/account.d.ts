import { z } from 'zod';
import {
	AccountSchema,
	ChartSchema,
	SettingSchema,
	TransactionSchema,
	TransactionTagSchema,
} from './Schemas';

type Account = z.infer<typeof AccountSchema>;
type Transaction = z.infer<typeof TransactionSchema>;
type Setting = z.infer<typeof SettingSchema>;
type TransactionTag = z.infer<typeof TransactionTagSchema>;
type FTChart = z.infer<typeof ChartSchema>;

type ChartFrequency = 'Days' | 'Weeks' | 'Months' | 'Years'
type DistributionChartType = 'Pie' | 'Doughnut'

export { Account, Transaction, TransactionTag, ChartFrequency, DistributionChartType, FTChart };
