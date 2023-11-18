import { useRef, useState } from 'react';
import FTButton from './FTButton';
import FTInput from './FTInput';
import { useBearStore } from '../GlobalState';
import { FileInput } from './FTFileInput';
import { z } from 'zod';
import TransactionTagSelect from './TransactionTagSelect';

const UploadFile = async (file: File, apiURL: string) => {
	try {
		const result = { id: '', name: file.name };
		const formData = new FormData();
		formData.append('file', file);
		const fetchedId = await fetch(apiURL + '/files/upload', {
			method: 'POST',
			body: formData,
		});
		const id = z.string().parse(await fetchedId.text());
		result.id = id;
		console.log(result);

		return result;
	} catch {
		return null;
	}
};

const SaveTransaction = async (
	accountId: string,
	name: string,
	date: number,
	tag: string,
	amount: number,
	file: {
		id: string;
		name: string;
	} | null,
	apiURL: string,
) => {
	await fetch(apiURL + '/accounts/' + accountId + '/transactions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, date, tag, amount, file }),
	});
};

const AddTransactionModal = ({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}) => {
	const { account, setAccount, refreshAccount, apiURL } = useBearStore();

	const [name, setName] = useState('');
	const [date, setDate] = useState('');
	const [tag, setTag] = useState(account!.tags[0].id);
	const [amount, setAmount] = useState(0);
	const fileInput = useRef<HTMLInputElement | null>();

	return (
		<div
			className={`${
				isOpen ? 'flex' : 'hidden'
			} absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
			onClick={e => {
				if (e.target === e.currentTarget) {
					setIsOpen(false);
					setName('');
					setDate('');
					setAmount(0);
					setTag(account!.tags[0].id)
					if (fileInput.current) {
						fileInput.current.value = '';
					}
				}
			}}
		>
			<div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center">
				<p className="m-2 text-active-text-color text-xl">Add Transaction</p>
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
				<div className="flex flex-row gap-3 items-center">
					<p className="text-text-color">Tag : </p>
					<TransactionTagSelect
						value={tag}
						onChange={e => setTag(e.target.value)}
					/>
				</div>
				<FileInput
					className="m-2"
					ref={element => {
						if (element) {
							fileInput.current = element;
						}
					}}
				/>
				<FTButton
					className="m-2"
					onClick={async () => {
						if (!name || !date || !tag || !amount) return;
						let fileObject = null;
						if (fileInput.current && fileInput.current.files) {
							fileObject = await UploadFile(fileInput.current.files[0], apiURL);
						}
						await SaveTransaction(
							account!.id,
							name,
							new Date(date).getTime(),
							tag,
							amount,
							fileObject,
							apiURL,
						);
						await refreshAccount(account!.id, setAccount, apiURL);
						setIsOpen(false);
						setName('');
						setDate('');
						setAmount(0);
						setTag(account!.tags[0].id)
						if (fileInput.current) {
							fileInput.current.value = '';
						}
					}}
				>
					Save Transaction
				</FTButton>
			</div>
		</div>
	);
};

export default AddTransactionModal;
