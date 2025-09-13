import { FetchServerType, Transaction } from "@finance-tracker/types";
import { ReactNode, createContext, useContext, useState } from "react";
import AddTransactionModal from "./AddTransactionModal";
import FTBooleanModal from "./FTBooleanModal";
import FTCreateChartModal from "./FTCreateChartModal";
import FTCreateScheduledModal from "./FTCreateScheduledModal";
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
      chartId?: string;
    }
  | {
      type: "AddTransaction";
      saveTransaction: (
        transaction: Omit<Transaction, "id">,
        accountId: string,
        fetchServer: FetchServerType,
        transactionId?: string,
      ) => Promise<string>;
      transactionId?: string;
    }
  | {
      type: "AddScheduled";
    };

interface ModalContextType {
  showModal: (props: ShowModalProps) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  // Removed modalData, not needed with stack rendering
  const [modalStack, setModalStack] = useState<ShowModalProps[]>([]);

  const showModal = (props: ShowModalProps) => {
    setModalStack((prev) => [...prev, props]);
  };

  const hideModal = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  // Removed modalData effect, not needed with stack rendering

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalStack.length > 0 && (
        <>
          {modalStack.map((modal, idx) => {
            const isTop = idx === modalStack.length - 1;
            const commonProps = {
              style: { display: isTop ? "flex" : "none" },
              className:
                "absolute top-0 left-[280px] mobile:left-0 h-screen w-[calc(100vw-280px)] mobile:w-screen flex justify-center items-center z-[1000]",
            };
            switch (modal.type) {
              case "Info":
                return (
                  <div key={idx} {...commonProps}>
                    <FTInfoModal
                      confirmText={modal.confirmText || "Ok"}
                      hideModal={hideModal}
                      title={modal.title}
                      callback={modal.callback}
                    />
                  </div>
                );
              case "Boolean":
                return (
                  <div key={idx} {...commonProps}>
                    <FTBooleanModal
                      confirmText={modal.confirmText || "Ok"}
                      hideModal={hideModal}
                      title={modal.title}
                      callback={modal.callback}
                      cancelText={modal.cancelText || "No"}
                      cancelCallback={modal.cancelCallback}
                    />
                  </div>
                );
              case "OTP":
                return (
                  <div key={idx} {...commonProps}>
                    <FTOTPModal hideModal={hideModal} />
                  </div>
                );
              case "AddScheduled":
                return (
                  <div key={idx} {...commonProps}>
                    <FTCreateScheduledModal hideModal={hideModal} />
                  </div>
                );
              case "Chart":
                return (
                  <div key={idx} {...commonProps}>
                    <FTCreateChartModal
                      hideModal={hideModal}
                      chartId={modal.chartId}
                    />
                  </div>
                );
              case "AddTransaction":
                return (
                  <div key={idx} {...commonProps}>
                    <AddTransactionModal
                      saveTransaction={modal.saveTransaction}
                      transactionId={modal.transactionId}
                      hideModal={hideModal}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}
        </>
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
