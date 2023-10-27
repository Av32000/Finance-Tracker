import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import NavBar from '../components/NavBar';
import FTInput from '../components/FTInput';
import FTButton from '../components/FTButton';
import { Account } from '../account';

const Settings = () => {
	const { account, refreshAccount, setAccount, apiURL } = useBearStore();
	const [newAccountName, setNewAccountName] = useState('');

	const Reset = (account: Account) => {
		setNewAccountName(account.name);
	};

	const Save = async (account: Account) => {
		await fetch(apiURL + '/accounts/' + account.id, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newAccountName }),
		});

		await refreshAccount(account.id, setAccount, apiURL);
	};

	useEffect(() => {
		if (account) {
			Reset(account);
		}
	}, [account]);

	useEffect(() => {
		document.title = 'Finance Tracker - Settings';
	});
	return (
		<div className="overflow-hidden flex">
			<NavBar />
			{account ? (
				<div className="bg-bg flex-1 h-screen flex flex-col relative">
					<div className="w-full p-4 flex flex-row justify-between">
						<div className="flex items-start">
							<img src="/pages/settings.svg" className="w-6 m-2" />
							<div className="flex flex-col">
								<h1 className="text-active-text-color text-2xl">Settings</h1>
								<p className="text-text-color">Edit account settings</p>
							</div>
						</div>
						<div className="flex flex-row items-center gap-3">
							{newAccountName != account.name ? (
								<>
									<FTButton className="h-10" onClick={() => Save(account)}>
										Save Settings
									</FTButton>
									<FTButton
										className="bg-red h-10"
										onClick={() => Reset(account)}
									>
										Clear Modifications
									</FTButton>
								</>
							) : null}
						</div>
					</div>
					<div className="p-4 flex flex-col gap-5">
						<div className="flex flex-row items-center gap-3">
							<p className="text-active-text-color">Account Name : </p>
							<FTInput
								placeholder="Account Name"
								value={newAccountName}
								onChange={e => setNewAccountName(e.target.value)}
							/>
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 h-screen bg-bg flex items-center justify-center">
					<p className="text-2xl text-text-color">No Account</p>
				</div>
			)}
		</div>
	);
};

export default Settings;
