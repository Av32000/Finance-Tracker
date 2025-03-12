import { ReactNode, createContext, useContext, useState } from "react";
import FTBooleanModal from "./FTBooleanModal";
import FTCreateChartModal from "./FTCreateChartModal";
import FTInfoModal from "./FTInfoModal";
import FTOTPModal from "./FTOTPModal";

type ShowModalProps =
  | {
      type: "Info";
      title: string;
      callback?: () => void;
      confirmText?: string;
    }
  | {
      type: "Boolean";
      title: string;
      confirmText?: string;
      cancelText?: string;
      callback?: () => void;
      cancelCallback?: () => void;
    }
  | {
      type: "OTP";
    }
  | {
      type: "Chart";
    };

interface ModalContextType {
  showModal: (props: ShowModalProps) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalData, setModalData] = useState<ShowModalProps | null>(null);

  const showModal = (props: ShowModalProps) => {
    setModalData(props);
  };

  const hideModal = () => {
    setModalData(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalData && (
        <div className="absolute top-0 left-[280px] mobile:left-0 h-screen w-[calc(100vw-280px)] mobile:w-screen flex justify-center items-center">
          {modalData.type === "Info" && (
            <FTInfoModal
              confirmText={modalData.confirmText || "Ok"}
              hideModal={hideModal}
              title={modalData.title}
              callback={modalData.callback}
            />
          )}

          {modalData.type === "Boolean" && (
            <FTBooleanModal
              confirmText={modalData.confirmText || "Ok"}
              hideModal={hideModal}
              title={modalData.title}
              callback={modalData.callback}
              cancelText={modalData.cancelText || "No"}
              cancelCallback={modalData.cancelCallback}
            />
          )}

          {modalData.type === "OTP" && <FTOTPModal hideModal={hideModal} />}
          {modalData.type === "Chart" && (
            <FTCreateChartModal hideModal={hideModal} />
          )}
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
