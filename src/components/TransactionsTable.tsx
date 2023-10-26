import { useBearStore } from '../GlobalState';
import AmountTag from './AmountTag';

const TransactionsTable = () => {
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
						{account.transactions.map(t => (
							<tr key={t.id}>
								<td className="text-center text-active-text-color p-2">
									{t.name}
								</td>
								<td className="text-center text-text-color">
									{new Date(t.date).toLocaleDateString()}
								</td>
								<td className="text-center text-active-text-color">
									<AmountTag amount={t.amount} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p>No Account</p>
			)}
		</div>
	);
};

export default TransactionsTable;
