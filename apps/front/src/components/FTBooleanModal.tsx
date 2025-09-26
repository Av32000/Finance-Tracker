import { useState } from "react";
import FTButton from "./FTButton";
import FTCheckbox from "./FTCheckbox";

const FTBooleanModal = ({
  hideModal,
  callback,
  cancelCallback,
  options,
  title,
  confirmText,
  cancelText,
}: {
  hideModal: () => void;
  callback?: (options: { key: string; value: boolean }[]) => void;
  cancelCallback?: () => void;
  options?: { key: string; label: string }[];
  title: string;
  confirmText: string;
  cancelText: string;
}) => {
  const [selectedOptions, setSelectedOptions] = useState(
    options ? options.map((o) => ({ ...o, value: false })) : [],
  );
  return (
    <div
      className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideModal();
        }
      }}
    >
      <div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center mobile:w-5/6">
        <p className="p-3 text-active-text-color mobile:text-center">{title}</p>
        {options &&
          options.map((option, idx) => (
            <div className="flex items-center gap-2 mb-2" key={option.key}>
              <FTCheckbox
                checked={selectedOptions[idx].value}
                onChange={(e) => {
                  const newOptions = [...selectedOptions];
                  newOptions[idx].value = e.target.checked;
                  setSelectedOptions(newOptions);
                }}
              />
              <p className="text-active-text-color">{option.label}</p>
            </div>
          ))}
        <div className="flex flex-row-reverse gap-2 mobile:flex-col mobile:mt-2">
          <FTButton
            onClick={() => {
              if (callback) callback(selectedOptions);
              hideModal();
            }}
          >
            {confirmText}
          </FTButton>
          <FTButton
            className="bg-red"
            onClick={() => {
              if (cancelCallback) cancelCallback();
              hideModal();
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
