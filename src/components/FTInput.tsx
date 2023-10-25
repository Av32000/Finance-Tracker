import { InputHTMLAttributes } from 'react';

const FTInput = (params: InputHTMLAttributes<HTMLInputElement>) => {
	const className = params.className;
	return (
		<input
			type="text"
			{...params}
			className={
				'bg-bg-light border-text-color border rounded text-active-text-color outline-none px-1 ' +
				className
			}
		/>
	);
};

export default FTInput;
