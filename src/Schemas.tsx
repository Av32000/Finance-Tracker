import { z } from 'zod';

const TransactionSchema = z.object({
	id: z.string(),
	created_at: z.number(),
	name: z.string(),
	amount: z.number(),
	date: z.number(),
});

const AccountSchema = z.object({
	id: z.string(),
	name: z.string(),
	balance: z.number(),
	transactions: z.array(TransactionSchema),
});

const AccountsSchema = z.array(AccountSchema);

export { AccountSchema, AccountsSchema, TransactionSchema };
