import { FormatMoney } from '../Utils';

const AmountTag = ({ amount }: { amount: number }) => {
	return (
		<div className="flex items-center justify-center">
			<p
				className={`text-active-text-color p-2 text-center w-24 h-7 rounded-2xl flex items-center justify-center ${
					amount > 0 ? 'bg-green' : 'bg-red'
				}`}
			>
				{FormatMoney(amount)} €
			</p>
		</div>
	);
};

export default AmountTag;
