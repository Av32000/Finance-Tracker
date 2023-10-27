import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import NavBar from '../components/NavBar';
import FTInput from '../components/FTInput';
import FTButton from '../components/FTButton';
import TransactionsTable from '../components/TransactionsTable';
import AddTransactionModal from '../components/AddTransactionModal';
import FTBooleanModal from '../components/FTBooleanModal';

const DeleteTransaction = async (
	tId: string,
	accountId: string,
	apiURL: string,
) => {
	await fetch(apiURL + '/accounts/' + accountId + '/transactions/' + tId, {
		method: 'DELETE',
	});
};

const Transactions = () => {
	const [addNewTransactionModalIsOpen, setAddNewTransactionModalIsOpen] =
		useState(false);
	const [filter, setFilter] = useState('');
	const [selected, setSelected] = useState<string[]>([]);
	const [
		confirmDeleteTransactionModalIsOpen,
		setConfirmDeleteTransactionModalIsOpen,
	] = useState(false);
	const { account, setAccount, refreshAccount, apiURL } = useBearStore();

	useEffect(() => {
		document.title = 'Finance Tracker - Transactions';
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
							{selected.length == 0 ? (
								<>
									<FTInput
										placeholder="Search"
										className="h-10"
										value={filter}
										onChange={e => setFilter(e.target.value)}
									/>
									<FTButton
										className="h-10"
										onClick={() => setAddNewTransactionModalIsOpen(true)}
									>
										Add Transaction
									</FTButton>
								</>
							) : (
								<FTButton
									className="h-10 bg-red"
									onClick={() => setConfirmDeleteTransactionModalIsOpen(true)}
								>
									Delete Transaction{selected.length > 1 ? 's' : ''}
								</FTButton>
							)}
						</div>
					</div>
					<TransactionsTable
						filter={filter}
						selected={selected}
						setSelected={setSelected}
					/>
					<AddTransactionModal
						setIsOpen={setAddNewTransactionModalIsOpen}
						isOpen={addNewTransactionModalIsOpen}
					/>
					<FTBooleanModal
						title={`Are you sure you want to delete ${
							selected.length
						} transaction${selected.length > 1 ? 's' : ''} ?`}
						confirmText={`Delete ${selected.length} transaction${
							selected.length > 1 ? 's' : ''
						}`}
						cancelText="Cancel"
						callback={async () => {
							const promises = selected.map(s =>
								DeleteTransaction(s, account.id, apiURL),
							);
							await Promise.all(promises);
							await refreshAccount(account.id, setAccount, apiURL);
							setSelected([]);
						}}
						isOpen={confirmDeleteTransactionModalIsOpen}
						setIsOpen={setConfirmDeleteTransactionModalIsOpen}
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
