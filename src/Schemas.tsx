import { z } from 'zod';

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

const AccountSchema = z.object({
	id: z.string(),
	name: z.string(),
	balance: z.number(),
	transactions: z.array(TransactionSchema),
	monthly: z.number(),
	currentMonthly: z.number(),
	settings: z.array(SettingSchema),
	tags: z.array(TransactionTagSchema),
});

const AccountsSchema = z.array(AccountSchema);

export {
	AccountSchema,
	AccountsSchema,
	TransactionSchema,
	SettingSchema,
	TransactionTagSchema,
};
