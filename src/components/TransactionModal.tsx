import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import { Transaction } from '../account';
import AmountTag from './AmountTag';
import { FormatDate } from '../Utils';

const TransactionModal = ({
	isOpen,
	setIsOpen,
	transactionId,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	transactionId: string;
}) => {
	const { account } = useBearStore();

	const [transaction, setTransaction] = useState<Transaction>();

	useEffect(() => {
		if (transactionId && account) {
			setTransaction(account.transactions.find(t => t.id === transactionId));
		}
	}, [transactionId, account, isOpen]);

	return (
		transaction && (
			<div
				className={`${
					isOpen ? 'flex' : 'hidden'
				} absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
				onClick={e => {
					if (e.target === e.currentTarget) {
						setIsOpen(false);
					}
				}}
			>
				<div className="px-9 py-8 bg-bg-light rounded-xl flex flex-col w-1/2">
					<div className="w-full flex flex-row justify-between">
						<p className="text-active-text-color text-xl">{transaction.name}</p>
						<AmountTag amount={transaction.amount} />
					</div>
					<p className="text-text-color">{FormatDate(transaction.date)}</p>
					{transaction.description && (
						<p className="text-active-text-color my-5 whitespace-pre-line">
							{transaction.description}
						</p>
					)}
				</div>
			</div>
		)
	);
};

export default TransactionModal;
