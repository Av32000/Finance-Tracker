import { useBearStore } from '../GlobalState';
import { Transaction } from '../account';
import AmountTag from './AmountTag';
import FTCheckbox from './FTCheckbox';
import FileTag from './FileTag';

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
		if (!isValid && transaction.file && transaction.file.name.includes(m))
			isValid = true;
		if (!isValid && FormatDate(transaction.date).includes(m)) isValid = true;
		if (!isValid && transaction.amount.toString().includes(m)) isValid = true;
	});

	return isValid;
};

const TransactionsTable = ({
	filter,
	selected,
	setSelected,
}: {
	filter: string;
	selected: string[];
	setSelected: (selected: string[]) => void;
}) => {
	const { account } = useBearStore();

	return (
		<div className="m-4">
			{account ? (
				<table className="table-fixed w-full border-spacing-y-px">
					<thead className="border-b-[1px] p-4 border-text-color">
						<tr className="text-active-text-color">
							<th className="w-7">
								<FTCheckbox
									checked={
										selected.length ===
											account.transactions.filter(t =>
												FilterItem(filter.trim(), t),
											).length &&
										account.transactions.filter(t =>
											FilterItem(filter.trim(), t),
										).length > 0
											? true
											: false
									}
									onChange={e => {
										if (e.target.checked) {
											setSelected(
												account.transactions
													.filter(t => FilterItem(filter.trim(), t))
													.map(t => t.id),
											);
										} else {
											setSelected([]);
										}
									}}
								/>
							</th>
							<th className="font-medium p-2">Name</th>
							<th className="font-medium p-2">Files</th>
							<th className="font-medium p-2">Date</th>
							<th className="font-medium p-2">Amount</th>
						</tr>
					</thead>
					<tbody>
						{
							// TODO : Add ScrollBar
							account.transactions.map(t => {
								if (!FilterItem(filter.trim(), t)) return;

								return (
									<tr
										key={t.id}
										className={
											selected.indexOf(t.id) != -1 ? 'bg-bg-light' : ''
										}
									>
										<td>
											<FTCheckbox
												checked={selected.indexOf(t.id) != -1}
												onChange={e => {
													if (e.target.checked && selected.indexOf(t.id) == -1)
														setSelected([...selected, t.id]);
													if (!e.target.checked && selected.indexOf(t.id) != -1)
														setSelected(selected.filter(i => i !== t.id));
												}}
											/>
										</td>
										<td className="text-center text-active-text-color p-2">
											{t.name}
										</td>
										<td>
											{t.file ? (
												<FileTag file={t.file} />
											) : (
												<p className="text-text-color text-center">No File</p>
											)}
										</td>
										<td className="text-center text-text-color">
											{FormatDate(t.date)}
										</td>
										<td className="text-center text-active-text-color">
											<AmountTag amount={t.amount} />
										</td>
									</tr>
								);
							})
						}
					</tbody>
				</table>
			) : (
				<p>No Account</p>
			)}
		</div>
	);
};

export default TransactionsTable;
