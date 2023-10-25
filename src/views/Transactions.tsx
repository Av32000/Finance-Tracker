import { useEffect } from 'react';
import { useBearStore } from '../GlobalState';
import NavBar from '../components/NavBar';
import FTInput from '../components/FTInput';
import FTButton from '../components/FTButton';

const Transactions = () => {
	const { account } = useBearStore();

	useEffect(() => {
		document.title = 'Finance Tracker - Home';
	});
	return (
		<div className="overflow-hidden flex">
			<NavBar />
			{account ? (
				<div className="bg-bg flex-1 h-screen flex flex-col">
					<div className="w-full p-4 flex flex-row justify-between">
						<div className="flex items-start">
							<img src="/pages/transactions.svg" className="w-5 m-2" />
							<div className="flex flex-col">
								<h1 className="text-active-text-color text-2xl">
									Transactions
								</h1>
								<p className="text-text-color">
									List of the registered transaction
								</p>
							</div>
						</div>
						<div className="flex flex-row items-center gap-3">
							<FTInput placeholder="Search" className="h-10" />
							<FTButton className="h-10">Add Transaction</FTButton>
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

export default Transactions;
