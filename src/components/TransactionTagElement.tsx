import { TransactionTag } from '../account';

const TransactionTagElement = ({
	tagId,
	accountTags,
}: {
	tagId: string;
	accountTags: TransactionTag[];
}) => {
	const tag = accountTags.find(t => t.id === tagId);
	return (
		<>
			<div className="flex items-center justify-center">
				{tag ? (
					<p
						className="text-active-text-color p-2 text-center w-28 h-7 rounded-2xl flex items-center justify-center"
						style={{ backgroundColor: tag.color }}
					>
						{tag.name}
					</p>
				) : (
					<p className="text-active-text-color p-2 text-center w-28 h-7 rounded-2xl flex items-center justify-center">
						No Tag
					</p>
				)}
			</div>
		</>
	);
};

export default TransactionTagElement;
