import { z } from 'zod';
import { AccountSchema, TransactionSchema } from './Schemas';

type Account = z.infer<typeof AccountSchema>;
type Transaction = z.infer<typeof TransactionSchema>;

export { Account, Transaction };
