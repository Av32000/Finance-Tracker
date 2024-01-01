import { create } from 'zustand';
import { Account, FetchServerType } from './account';
import { AccountSchema } from './Schemas';
type AppState = {
	account: Account | null;
	apiURL: string;
	setAccount: (account: Account) => void;
	refreshAccount: (
		id: string,
		setAccount: (account: Account) => void,
	) => Promise<void>;
	fetchServer: FetchServerType;
};

const apiURL = 'http://localhost:3000';

const fetchServer: FetchServerType = async (endpoint, options) => {
	return await fetch(
		apiURL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint),
		options,
	);
};

export const useBearStore = create<AppState>(set => ({
	account: null,
	apiURL,
	setAccount: account => set({ account }),
	refreshAccount: async (id, setAccount) => {
		try {
			const fetchedAccouts = await fetchServer('/accounts/' + id);
			const accounts = AccountSchema.parse(await fetchedAccouts.json());
			console.log(accounts);
			setAccount(accounts);
		} catch (e) {
			console.error(e);
		}
	},
	fetchServer,
}));
