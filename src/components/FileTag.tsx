import { useBearStore } from '../GlobalState';

const FileTag = ({ file }: { file: { id: string; name: string } }) => {
	const { openFileFromAPI } = useBearStore();
	return (
		<div
			className="flex items-center justify-center"
			onClick={() => {
				openFileFromAPI(file.id, file.name.split('.').pop() || '');
			}}
		>
			<p
				className={`text-active-text-color p-3 text-center bg-opacity-60 h-7 rounded-2xl flex gap-1 items-center justify-center cursor-pointer bg-text-color`}
			>
				<img src="/components/link.svg" className="w-4 mt-1" />
				{file.name}
			</p>
		</div>
	);
};

export default FileTag;
