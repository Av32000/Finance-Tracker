import { useBearStore } from '../GlobalState';
import { Transaction } from '../account';
import AmountTag from './AmountTag';

const FormatDate = (date: number) => {
	return new Date(date).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const FilterItem = (filter: string, transaction: Transaction) => {
	if (filter == '') return true;
	let isValid = false;
	filter.split(' ').forEach(m => {
		if (!isValid && transaction.id == m) isValid = true;
		if (!isValid && transaction.name.includes(m)) isValid = true;
		if (!isValid && FormatDate(transaction.date).includes(m)) isValid = true;
		if (!isValid && transaction.amount.toString().includes(m)) isValid = true;
	});

	return isValid;
};

const TransactionsTable = ({ filter }: { filter: string }) => {
	const { account } = useBearStore();

	return (
		<div className="m-4">
			{account ? (
				<table className="table-fixed w-full">
					<thead className="border-b-[1px] p-4 border-text-color">
						<tr className="text-active-text-color">
							<th className="font-medium p-2">Name</th>
							<th className="font-medium p-2">Date</th>
							<th className="font-medium p-2">Amount</th>
						</tr>
					</thead>
					<tbody>
						{account.transactions.map(t => {
							if (!FilterItem(filter.trim(), t)) return;

							return (
								<tr key={t.id}>
									<td className="text-center text-active-text-color p-2">
										{t.name}
									</td>
									<td className="text-center text-text-color">
										{FormatDate(t.date)}
									</td>
									<td className="text-center text-active-text-color">
										<AmountTag amount={t.amount} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			) : (
				<p>No Account</p>
			)}
		</div>
	);
};

export default TransactionsTable;
