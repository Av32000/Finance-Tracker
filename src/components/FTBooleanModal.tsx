import FTButton from './FTButton';

const FTBooleanModal = ({
	isOpen,
	setIsOpen,
	callback,
	title,
	confirmText,
	cancelText,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback: (...args: any) => void;
	title: string;
	confirmText: string;
	cancelText: string;
}) => {
	return (
		<div
			className={`${
				isOpen ? 'flex' : 'hidden'
			} absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
			onClick={e => {
				if (e.target === e.currentTarget) {
					setIsOpen(false);
				}
			}}
		>
			<div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center mobile:w-5/6">
				<p className="p-3 text-active-text-color mobile:text-center">{title}</p>
				<div className="flex flex-row-reverse gap-2 mobile:flex-col mobile:mt-2">
					<FTButton
						onClick={() => {
							callback();
							setIsOpen(false);
						}}
					>
						{confirmText}
					</FTButton>
					<FTButton
						className="bg-red"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						{cancelText}
					</FTButton>
				</div>
			</div>
		</div>
	);
};

export default FTBooleanModal;
