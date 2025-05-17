import { InputHTMLAttributes } from "react";

// Credit : https://marek-rozmus.medium.com/styling-checkbox-with-tailwind-46a92c157e2d
const FTCheckbox = (
  params: Omit<InputHTMLAttributes<HTMLInputElement>, "type">,
) => {
  const className = params.className;
  return (
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        {...params}
        className={
          "relative peer shrink-0 appearance-none border-[1px] w-4 h-4 rounded border-text-color checked:bg-cta-primarly mt-1 checked:border-0 " +
          className
        }
      />
      <svg
        className="absolute w-4 h-4 mt-1 stroke-active-text-color hidden peer-checked:block pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
};

export default FTCheckbox;
