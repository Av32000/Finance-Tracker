import { Filter } from './DataBuilder.d';
import { Account } from './account';

const FormatDate = (date: number) => {
	return new Date(date).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const FormatDateWithoutHours = (date: number) => {
	return new Date(date).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	});
};

const FilterTransactions = (account: Account, filters: Filter[]) => {
	const result: string[] = [];
	if (filters.length == 0) {
		return account.transactions.map(t => t.id);
	}
	account.transactions.forEach(t => {
		let isValid = true;
		filters.forEach(f => {
			if (f.type == 'string' && isValid) {
				if (f.operation == '=') {
					isValid = t[f.propsName] == f.value;
				} else {
					isValid = t[f.propsName] != f.value;
				}
			} else if (f.type == 'number' && isValid) {
				if (f.operation == '<') {
					isValid = t[f.propsName] < f.value;
				} else if (f.operation == '<=') {
					isValid = t[f.propsName] <= f.value;
				} else if (f.operation == '=') {
					isValid = t[f.propsName] == f.value;
				} else if (f.operation == '!=') {
					isValid = t[f.propsName] != f.value;
				} else if (f.operation == '>') {
					isValid = t[f.propsName] > f.value;
				} else if (f.operation == '>=') {
					isValid = t[f.propsName] >= f.value;
				}
			}
		});
		if (isValid) result.push(t.id);
	});

	return result;
};

const FormatMoney = (value: number): string => {
	return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
};

export { FormatDate, FormatDateWithoutHours, FilterTransactions, FormatMoney };
