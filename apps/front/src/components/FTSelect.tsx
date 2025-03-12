import { SelectHTMLAttributes } from "react";
import { useBearStore } from "../GlobalState";

const FTSelect = (params: SelectHTMLAttributes<HTMLSelectElement>) => {
  const { account } = useBearStore();
  const { className, ...props } = params;
  return account ? (
    <>
      <select
        {...props}
        className={`bg-bg-light border-text-color border rounded text-active-text-color outline-none px-3 py-1 appearance-none ${className} text-center`}
      >
        {params.children}
      </select>
    </>
  ) : null;
};

export default FTSelect;
