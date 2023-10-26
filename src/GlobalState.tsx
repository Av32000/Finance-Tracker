import { create } from 'zustand';
import { Account } from './account';
import { AccountSchema } from './Schemas';
type AppState = {
	account: Account | null;
	apiURL: string;
	setAccount: (account: Account) => void;
	refreshAccount: (
		id: string,
		setAccount: (account: Account) => void,
		apiURL: string,
	) => Promise<void>;
};

export const useBearStore = create<AppState>(set => ({
	account: null,
	apiURL: 'http://localhost:3000',
	setAccount: account => set({ account }),
	refreshAccount: async (id, setAccount, apiURL) => {
		try {
			const fetchedAccouts = await fetch(apiURL + '/account/' + id);
			const accounts = AccountSchema.parse(await fetchedAccouts.json());
			console.log(accounts);
			setAccount(accounts);
		} catch (e) {
			console.error(e);
		}
	},
}));
