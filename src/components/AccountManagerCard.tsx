import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import { Account } from '../account';
import { AccountsSchema } from '../Schemas';

type State = 'Closed' | 'Switch' | 'Create';

const RefreshAccounts = async (
	setAccounts: (accounts: Account[]) => void,
	apiURL: string,
) => {
	try {
		const fetchedAccouts = await fetch(apiURL + '/accounts');
		const accounts = AccountsSchema.parse(await fetchedAccouts.json());
		console.log(accounts);
		setAccounts(accounts);
	} catch (e) {
		console.error(e);
	}
};

const AccountManagerCard = () => {
	const [status, setStatus] = useState<State>('Closed');
	const [accounts, setAccounts] = useState<Account[] | null>(null);
	const [loading, setLoading] = useState(true);
	const { account, setAccount, apiURL } = useBearStore();

	useEffect(() => {
		if (!accounts) {
			RefreshAccounts(setAccounts, apiURL);
		}

		console.log(account);

		if (!account && accounts && accounts.length > 0) {
			setAccount(accounts[0]);
			setLoading(false);
		}
	}, [accounts]);

	return (
		<div className="flex items-center justify-center text-active-text-color absolute bottom-0 bg-bg-light w-1/5 h-[5rem]">
			{loading ? (
				<p>Loading...</p>
			) : (
				<>
					{status === 'Closed' && account ? (
						<div className="flex items-center justify-center w-8 h-8 rounded-md bg-bg">
							<div>{account.name[0]}</div>
						</div>
					) : null}
					{status === 'Switch' && accounts ? <div></div> : null}
					{status === 'Create' ? <div></div> : null}
				</>
			)}
		</div>
	);
};

export default AccountManagerCard;
