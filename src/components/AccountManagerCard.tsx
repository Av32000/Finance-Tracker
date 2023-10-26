import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import { Account } from '../account';
import { AccountsSchema } from '../Schemas';
import FTInput from './FTInput';
import FTButton from './FTButton';

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
	const [newAccount, setNewAccount] = useState('');
	const { account, setAccount, refreshAccount, apiURL } = useBearStore();
	const [loading, setLoading] = useState(!account);

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
					{status !== 'Create' && account ? (
						<div
							className={`flex justify-center flex-col ${
								status == 'Switch' ? 'min-h-[5rem]' : ''
							}`}
						>
							<div
								className="flex gap-2 items-center cursor-pointer m-3"
								onClick={() => setStatus('Closed')}
							>
								<div className="flex items-center justify-center w-8 h-8 rounded-md bg-bg">
									{account.name[0]}
								</div>
								<p className="text-lg">{account.name}</p>
							</div>
							{accounts
								?.filter(a => a.id !== account.id)
								.map(a => (
									<div
										key={a.id}
										className={`flex gap-2 items-center cursor-pointer m-3 ${
											status == 'Closed' ? 'hidden' : ''
										}`}
										onClick={() => {
											refreshAccount(a.id, setAccount, apiURL).then(() =>
												setStatus('Closed'),
											);
										}}
									>
										<div className="flex items-center justify-center w-8 h-8 rounded-md bg-bg">
											{a.name[0]}
										</div>
										<p className="text-lg">{a.name}</p>
									</div>
								))}
							<FTButton
								className={`m-3 ${status == 'Closed' ? 'hidden' : ''}`}
								onClick={() => setStatus('Create')}
							>
								Create Account
							</FTButton>
						</div>
					) : null}
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
							<FTButton
								onClick={() => {
									createAccount(newAccount, apiURL).then(id => {
										if (id) {
											refreshAccount(id, setAccount, apiURL).then(() =>
												setStatus('Closed'),
											);
										} else {
											console.error("Can't create Account");
										}
									});
									RefreshAccounts(setAccounts, apiURL);
								}}
							>
								Create Account
							</FTButton>
						</div>
					) : null}
					{accounts && accounts.length > 0 ? (
						<img
							src="/components/open-arrow.svg"
							className={`absolute top-2 right-1 w-[30px] h-[15px] cursor-pointer ${
								status != 'Closed' ? 'rotate-180' : ''
							}`}
							onClick={() => {
								if (status != 'Closed') setStatus('Closed');
								else setStatus('Switch');
							}}
						/>
					) : null}
				</>
			)}
		</div>
	);
};

export default AccountManagerCard;
