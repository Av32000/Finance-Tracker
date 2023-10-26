import { useState } from 'react';
import FTButton from './FTButton';
import FTInput from './FTInput';
import { useBearStore } from '../GlobalState';
import { Account } from '../account';
import { AccountSchema } from '../Schemas';

const SaveTransaction = async (
	accountId: string,
	name: string,
	date: number,
	amount: number,
	apiURL: string,
) => {
	await fetch(apiURL + '/accounts/' + accountId + '/transactions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, date, amount }),
	});
};

// TODO : Stack RefreshAccount Duplication in one file (GlobalState?)
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

const AddTransactionModal = ({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}) => {
	const [name, setName] = useState('');
	const [date, setDate] = useState('');
	const [amount, setAmount] = useState(0);
	const { account, setAccount, apiURL } = useBearStore();

	return (
		<div
			className={`${
				isOpen ? 'flex' : 'hidden'
			} absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
			onClick={e => {
				if (e.target === e.currentTarget) {
					setName('');
					setDate('');
					setAmount(0);
					setIsOpen(false);
				}
			}}
		>
			<div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center">
				<p className="m-2 text-active-text-color">Add Transaction</p>
				<FTInput
					placeholder="Name"
					className="m-2"
					value={name}
					onChange={e => setName(e.target.value)}
				/>
				<FTInput
					placeholder="Date"
					className="m-2"
					type="datetime-local"
					value={date}
					onChange={e => setDate(e.target.value)}
				/>
				<FTInput
					placeholder="Amount"
					className="m-2"
					type="number"
					value={amount}
					onChange={e => {
						const nRegex = /^-?\d+(\.\d+)?$/;
						if (nRegex.test(e.target.value)) setAmount(Number(e.target.value));
					}}
				/>
				<FTButton
					className="m-2"
					onClick={() => {
						if (!name || !date || !amount) return;
						SaveTransaction(
							account!.id,
							name,
							new Date(date).getTime(),
							amount,
							apiURL,
						).then(() => {
							RefreshAccount(account!.id, setAccount, apiURL).then(() => {
								setIsOpen(false);
								setName('');
								setDate('');
								setAmount(0);
							});
						});
					}}
				>
					Save Transaction
				</FTButton>
			</div>
		</div>
	);
};

export default AddTransactionModal;
