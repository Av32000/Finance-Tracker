import { InputHTMLAttributes } from 'react';

const FTInput = (params: InputHTMLAttributes<HTMLInputElement>) => {
	const className = params.className;
	return (
		<input
			type="text"
			{...params}
			className={
				'bg-transparent border-text-color border rounded text-active-text-color outline-none px-2 py-1 ' +
				className
			}
		/>
	);
};

export default FTInput;
