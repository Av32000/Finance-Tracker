import { TransactionTag } from '../account';

const TransactionTagElement = ({
	tagId,
	accountTags,
}: {
	tagId: string;
	accountTags: TransactionTag[];
}) => {
	const tag = accountTags.find(t => t.id === tagId);
	return tag ? (
		<>
			<div className="flex items-center justify-center">
				<p
					className="text-active-text-color p-2 text-center w-28 h-7 rounded-2xl flex items-center justify-center"
					style={{ backgroundColor: tag.color }}
				>
					{tag.name}
				</p>
			</div>
		</>
	) : null;
};

export default TransactionTagElement;
