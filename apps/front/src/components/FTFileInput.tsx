import { InputHTMLAttributes, Ref, forwardRef } from 'react';

// https://flowbite.com/docs/forms/file-input/
const FTFileInput = (
	params: InputHTMLAttributes<HTMLInputElement>,
	ref: Ref<HTMLInputElement>,
) => {
	const className = params.className;
	return (
		<input
			type="file"
			ref={ref}
			{...params}
			className={
				'block w-full text-sm appearance-none border-none rounded-lg cursor-pointer text-active-text-color focus:outline-none bg-bg-dark border-text-color placeholder-text-color ' +
				className
			}
		/>
	);
};

export const FileInput = forwardRef(FTFileInput);
