import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import NavBar from '../components/NavBar';
import FTInput from '../components/FTInput';
import FTButton from '../components/FTButton';
import TransactionsTable from '../components/TransactionsTable';
import AddTransactionModal from '../components/AddTransactionModal';

const Transactions = () => {
	const [addNewTransactionModalIsOpen, setAddNewTransactionModalIsOpen] =
		useState(false);
	const { account } = useBearStore();

	useEffect(() => {
		document.title = 'Finance Tracker - Home';
	});
	return (
		<div className="overflow-hidden flex">
			<NavBar />
			{account ? (
				<div className="bg-bg flex-1 h-screen flex flex-col relative">
					<div className="w-full p-4 flex flex-row justify-between">
						<div className="flex items-start">
							<img src="/pages/transactions.svg" className="w-5 m-2" />
							<div className="flex flex-col">
								<h1 className="text-active-text-color text-2xl">
									Transactions
								</h1>
								<p className="text-text-color">
									List of the registered transactions
								</p>
							</div>
						</div>
						<div className="flex flex-row items-center gap-3">
							<FTInput placeholder="Search" className="h-10" />
							<FTButton
								className="h-10"
								onClick={() => setAddNewTransactionModalIsOpen(true)}
							>
								Add Transaction
							</FTButton>
						</div>
					</div>
					<TransactionsTable />
					<AddTransactionModal
						setIsOpen={setAddNewTransactionModalIsOpen}
						isOpen={addNewTransactionModalIsOpen}
					/>
				</div>
			) : (
				<div className="flex-1 h-screen bg-bg flex items-center justify-center">
					<p className="text-2xl text-text-color">No Account</p>
				</div>
			)}
		</div>
	);
};

export default Transactions;
