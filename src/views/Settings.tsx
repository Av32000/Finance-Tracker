import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import NavBar from '../components/NavBar';
import FTInput from '../components/FTInput';
import FTButton from '../components/FTButton';
import { Account, FetchServerType } from '../account';
import { startRegistration } from '@simplewebauthn/browser';

const Settings = () => {
	const { account, refreshAccount, setAccount, fetchServer } = useBearStore();
	const [newAccountName, setNewAccountName] = useState('');
	const [newMonthly, setNewMonthly] = useState(0);

	const Reset = (account: Account) => {
		setNewAccountName(account.name);
		setNewMonthly(account.monthly);
	};

	const register = async (fetchServer: FetchServerType) => {
		return new Promise<void>(async (resolve, reject) => {
			const resp = await fetchServer('/generate-new-key-options');
			let attResp;
			try {
				attResp = await startRegistration(await resp.json());
			} catch (error) {
				reject(error);
				throw error;
			}

			const verificationResp = await fetchServer(
				'/verify-new-key-registration',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(attResp),
				},
			);

			const verificationJSON = await verificationResp.json();

			if (verificationJSON) {
				resolve();
			} else {
				reject(verificationJSON);
			}
		});
	};

	const Save = async (account: Account) => {
		await fetchServer('/accounts/' + account.id, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newAccountName }),
		});

		await fetchServer('/accounts/' + account.id + '/monthly', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ monthly: newMonthly }),
		});

		await refreshAccount(account.id, setAccount);
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
							{newAccountName != account.name ||
							newMonthly != account.monthly ? (
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
						<div className="flex flex-row items-center gap-3">
							<p className="text-active-text-color">Monthly Budget : </p>
							<FTInput
								type="number"
								value={newMonthly}
								onChange={e => {
									const nRegex = /^\d+$/;
									if (nRegex.test(e.target.value))
										setNewMonthly(Number(e.target.value));
								}}
							/>
						</div>
						<div className="flex gap-2">
							<FTButton
								onClick={() => {
									fetchServer(`/accounts/${account.id}/export`)
										.then(response => response.blob())
										.then(blob => {
											const url = window.URL.createObjectURL(blob);
											const a = document.createElement('a');
											a.href = url;
											a.download =
												account.name.replace(/[^a-zA-Z0-9-_.]/g, '') + '.zip';
											document.body.appendChild(a);
											a.click();
											window.URL.revokeObjectURL(url);
										});
								}}
							>
								Export Account Data
							</FTButton>
							<FTButton onClick={() => {}}>Import Account Data</FTButton>
						</div>
						<div>
							<FTButton
								onClick={() => {
									register(fetchServer);
								}}
							>
								Add New Passkey
							</FTButton>
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
