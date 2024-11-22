import { ButtonHTMLAttributes, ReactNode } from 'react';

const FTButton = (
	params: ButtonHTMLAttributes<HTMLButtonElement> & {
		children?: ReactNode;
	},
) => {
	const { children, className, ...props } = params;
	return (
		<button
			{...props}
			className={
				`bg-cta-primarly p-1 px-4 rounded text-active-text-color ` + className
			}
		>
			{children}
		</button>
	);
};

export default FTButton;
