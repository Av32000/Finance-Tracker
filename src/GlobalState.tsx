import { create } from 'zustand';
import { Account } from './account';
type AppState = {
	account: Account | null;
	apiURL: string;
	setAccount: (account: Account) => void;
};

export const useBearStore = create<AppState>(set => ({
	account: null,
	apiURL: 'http://localhost:3000',
	setAccount: account => set({ account }),
}));
