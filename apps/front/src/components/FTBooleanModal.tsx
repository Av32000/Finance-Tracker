import FTButton from "./FTButton";

const FTBooleanModal = ({
  hideModal,
  callback,
  cancelCallback,
  title,
  confirmText,
  cancelText,
}: {
  hideModal: () => void;
  callback?: () => void;
  cancelCallback?: () => void;
  title: string;
  confirmText: string;
  cancelText: string;
}) => {
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
        <div className="flex flex-row-reverse gap-2 mobile:flex-col mobile:mt-2">
          <FTButton
            onClick={() => {
              if (callback) callback();
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
