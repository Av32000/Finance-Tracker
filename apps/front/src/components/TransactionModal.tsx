import { Transaction } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import { FormatDate, renderTransactions } from "../Utils";
import AmountTag from "./AmountTag";
import FileTag from "./FileTag";
import FTButton from "./FTButton";
import TransactionTagElement from "./TransactionTagElement";

const TransactionModal = ({
  hideModal,
  deleteTransaction,
  editTransaction,
  saveTransaction,
  transactionId,
}: {
  hideModal: () => void;
  deleteTransaction?: (transactionId: string) => void;
  editTransaction?: (transactionId: string) => void;
  saveTransaction?: (
    transaction: Omit<Transaction, "id">,
    accountId: string,
    fetchServer: (path: string, options?: RequestInit) => Promise<Response>,
    transactionId?: string,
  ) => Promise<string>;
  transactionId: string;
}) => {
  const { account, fetchServer } = useBearStore();

  const [transaction, setTransaction] = useState<Transaction>();

  useEffect(() => {
    if (transactionId && account) {
      setTransaction(
        renderTransactions(account).find((t) => t.id === transactionId),
      );
    }
  }, [transactionId, account]);

  return (
    transaction && (
      <div
        className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            hideModal();
          }
        }}
      >
        <div className="px-9 py-8 bg-bg-light rounded-xl flex flex-col w-1/2 mobile:w-2/3 gap-1">
          <div className="w-full flex flex-row justify-between mobile:flex-col mobile:gap-3 mobile:my-3">
            <div className="flex flex-row justify-between items-center gap-3 mobile:flex-col mobile:items-start">
              <p className="text-active-text-color text-xl">
                {transaction.name}
              </p>
              <div className="flex gap-2">
                {editTransaction && (
                  <FTButton
                    className="!p-0 h-5 w-5 flex items-center justify-center"
                    onClick={() => editTransaction(transaction.id)}
                  >
                    <img
                      className="w-4"
                      src="/components/edit.svg"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </FTButton>
                )}
                {deleteTransaction && (
                  <FTButton
                    className="!p-0 h-5 w-5 flex items-center justify-center bg-red"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    <img
                      className="w-4"
                      src="/components/trash.svg"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </FTButton>
                )}
              </div>
            </div>
            <div className="flex flex-col mobile:flex-row mobile:gap-3">
              <AmountTag amount={transaction.amount} />
              <span className="desktop:hidden">
                {transaction.file && <FileTag file={transaction.file} />}
              </span>
            </div>
          </div>
          <p className="text-text-color">{FormatDate(transaction.date)}</p>
          {transaction.description && (
            <p className="text-active-text-color my-3 whitespace-pre-line">
              {transaction.description}
            </p>
          )}
          <div className="w-full flex flex-row justify-between mobile:flex-col mobile:gap-3">
            <div>
              {transaction.tags.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-2">
                  {transaction.tags.map((tag) => (
                    <TransactionTagElement
                      tagId={tag}
                      accountTags={account!.tags}
                      key={tag}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-text-color italic">No Tags</p>
              )}
              <span className="self-start mobile:hidden">
                {transaction.file && <FileTag file={transaction.file} />}
              </span>
            </div>
            {transaction.defered && saveTransaction && (
              <FTButton
                className="self-end mobile:self-start"
                onClick={() => {
                  const newTransaction = { ...transaction, defered: false };
                  saveTransaction(
                    newTransaction,
                    account!.id,
                    fetchServer,
                    transaction.id,
                  );
                }}
              >
                Mark effective
              </FTButton>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default TransactionModal;
