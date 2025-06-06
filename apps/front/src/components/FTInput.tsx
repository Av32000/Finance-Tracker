import { InputHTMLAttributes } from "react";

const FTInput = (params: InputHTMLAttributes<HTMLInputElement>) => {
  const className = params.className;
  return params.type != "color" ? (
    <input
      type="text"
      {...params}
      className={
        "bg-transparent border-text-color border rounded text-active-text-color outline-none px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none " +
        className
      }
    />
  ) : (
    params.type == "color" && (
      <input
        type="text"
        {...params}
        className={
          "bg-transparent border-text-color border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-10 h-10 rounded-md " +
          className
        }
      />
    )
  );
};

export default FTInput;
