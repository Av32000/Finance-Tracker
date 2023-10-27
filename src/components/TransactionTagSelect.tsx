import { SelectHTMLAttributes } from 'react';
import { useBearStore } from '../GlobalState';

const TransactionTagSelect = (
	params: SelectHTMLAttributes<HTMLSelectElement>,
) => {
	const { account } = useBearStore();
	const { className, ...props } = params;
	return account ? (
		<>
			<select
				{...props}
				className={`bg-bg-light border-text-color border rounded text-active-text-color outline-none px-3 py-1 appearance-none ${className}`}
			>
				{account.tags.map(t => (
					<option
						value={t.id}
						key={t.id}
						className="text-text-color bg-transparent"
					>
						{t.name}
					</option>
				))}
			</select>
		</>
	) : null;
};

export default TransactionTagSelect;
