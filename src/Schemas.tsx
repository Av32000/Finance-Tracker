import { z } from 'zod';

const AccountSchema = z.object({
	id: z.string(),
	name: z.string(),
});

const AccountsSchema = z.array(AccountSchema);

export { AccountSchema, AccountsSchema };
