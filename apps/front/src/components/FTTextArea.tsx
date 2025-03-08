import { TextareaHTMLAttributes, useEffect, useRef } from "react";

export const useAutosizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string,
) => {
  useEffect(() => {
    if (textAreaRef) {
      textAreaRef.style.height = "0px";
      const { scrollHeight } = textAreaRef;
      textAreaRef.style.height = `${scrollHeight < 100 ? scrollHeight : 100}px`;
    }
  }, [textAreaRef, value]);
};

const FTTextArea = (params: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const className = params.className;
  useAutosizeTextArea(textAreaRef.current, params.value?.toString() || "");

  return (
    <div>
      <textarea
        ref={textAreaRef}
        {...params}
        className={
          "resize-none overflow-y-scroll min-h-[35px] bg-transparent border-text-color border rounded text-active-text-color outline-none px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none " +
          className
        }
      />
    </div>
  );
};

export default FTTextArea;
