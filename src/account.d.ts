import { z } from 'zod';
import { AccountSchema } from './Schemas';

type Account = z.infer<typeof AccountSchema>;

export { Account };
