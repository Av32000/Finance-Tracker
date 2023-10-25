import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import { Account } from '../account';
import { AccountSchema, AccountsSchema } from '../Schemas';
import FTInput from './FTInput';

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

const RefreshAccount = async (
	id: string,
	setAccount: (account: Account) => void,
	apiURL: string,
) => {
	try {
		const fetchedAccouts = await fetch(apiURL + '/account/' + id);
		const accounts = AccountSchema.parse(await fetchedAccouts.json());
		console.log(accounts);
		setAccount(accounts);
	} catch (e) {
		console.error(e);
	}
};

const createAccount = async (newAccount: string, apiURL: string) => {
	try {
		const newAccountFetched = await fetch(apiURL + '/accounts', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify({ name: newAccount }),
		});
		const newId = await newAccountFetched.text();
		return newId;
	} catch (e) {
		console.error(e);
	}
};

const AccountManagerCard = () => {
	const [status, setStatus] = useState<State>('Closed');
	const [accounts, setAccounts] = useState<Account[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [newAccount, setNewAccount] = useState('');
	const { account, setAccount, apiURL } = useBearStore();

	useEffect(() => {
		if (!accounts) {
			RefreshAccounts(setAccounts, apiURL);
		}

		if (accounts && accounts?.length == 0) {
			setStatus('Create');
			setLoading(false);
		}

		if (!account && accounts && accounts.length > 0) {
			setAccount(accounts[0]);
			setLoading(false);
		}
	}, [accounts]);

	return (
		<div
			className={`flex items-center justify-center rounded-t-[10px] text-active-text-color absolute bottom-0 bg-bg-light w-[280px] ${
				status == 'Closed' ? 'h-[5rem]' : status == 'Create' ? 'h-[10rem]' : ''
			}`}
		>
			{loading ? (
				<p>Loading...</p>
			) : (
				<>
					{status === 'Closed' && account ? (
						<div className="flex gap-2 items-center">
							<div className="flex items-center justify-center w-8 h-8 rounded-md bg-bg">
								{account.name[0]}
							</div>
							<p className="text-lg">{account.name}</p>
						</div>
					) : null}
					{status === 'Switch' && accounts ? <div></div> : null}
					{status === 'Create' ? (
						<div className="flex flex-col items-center gap-3">
							<p>Create Account</p>
							<FTInput
								type="text"
								value={newAccount}
								placeholder="Account Name"
								onChange={e => setNewAccount(e.target.value)}
								className=""
							/>
							<button
								className="bg-cta-primarly p-1 px-4 rounded text-active-text-color"
								onClick={() =>
									createAccount(newAccount, apiURL).then(id => {
										if (id) {
											RefreshAccount(id, setAccount, apiURL).then(() =>
												setStatus('Closed'),
											);
										} else {
											console.error("Can't create Account");
										}
									})
								}
							>
								Create Account
							</button>
						</div>
					) : null}
				</>
			)}
		</div>
	);
};

export default AccountManagerCard;
