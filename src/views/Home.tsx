import { useEffect } from 'react';
import NavBar from '../components/NavBar';
import { useBearStore } from '../GlobalState';

const Home = () => {
	const { account } = useBearStore();

	useEffect(() => {
		document.title = 'Finance Tracker - Home';
	});
	return (
		<div className="overflow-hidden flex">
			<NavBar />
			{account ? (
				<div className="bg-bg flex-1 h-screen grid grid-cols-9 grid-rows-6 gap-3 p-4">
					<div className="bg-bg-light col-start-1 col-end-5 row-start-1 rounded-2xl flex items-center px-5 shadow-lg">
						<div className="p-3 rounded-full bg-bg-dark bg-opacity-80 h-16 w-16">
							<img src="/components/banknote.svg" className="h-full" />
						</div>
						<div className="flex flex-col p-2">
							<p className="text-text-color text-xs">Your Balance</p>
							<p className="text-active-text-color text-2xl">
								{account.balance} €
							</p>
						</div>
					</div>
					<div className="bg-bg-light col-start-5 col-end-10 row-start-1 row-end-4 rounded-2xl flex p-3 shadow-lg">
						<p className="text-text-color">Expenses Sources</p>
					</div>
					<div className="bg-bg-light col-start-1 col-end-5 row-start-2 row-end-5 rounded-2xl flex p-3 shadow-lg">
						<p className="text-text-color">Last Transactions</p>
					</div>
					<div className="bg-bg-light col-start-1 col-end-5 row-start-5 row-end-7 rounded-2xl flex p-3 shadow-lg">
						<p className="text-text-color">Monthly Budget</p>
					</div>
					<div className="bg-bg-light col-start-5 col-end-10 row-start-4 row-end-7 rounded-2xl flex p-3 shadow-lg">
						<p className="text-text-color">Balance Evolution</p>
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

export default Home;
