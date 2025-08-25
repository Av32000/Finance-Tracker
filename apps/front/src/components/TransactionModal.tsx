import { Transaction } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import { FormatDate } from "../Utils";
import AmountTag from "./AmountTag";
import FileTag from "./FileTag";
import TransactionTagElement from "./TransactionTagElement";

const TransactionModal = ({
  isOpen,
  setIsOpen,
  transactionId,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transactionId: string;
}) => {
  const { account } = useBearStore();

  const [transaction, setTransaction] = useState<Transaction>();

  useEffect(() => {
    if (transactionId && account) {
      setTransaction(account.transactions.find((t) => t.id === transactionId));
    }
  }, [transactionId, account, isOpen]);

  return (
    transaction && (
      <div
        className={`${
          isOpen ? "flex" : "hidden"
        } absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsOpen(false);
          }
        }}
      >
        <div className="px-9 py-8 bg-bg-light rounded-xl flex flex-col w-1/2 mobile:w-2/3 gap-1">
          <div className="w-full flex flex-row justify-between mobile:flex-col mobile:gap-3 mobile:my-3">
            <p className="text-active-text-color text-xl">{transaction.name}</p>
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
      </div>
    )
  );
};

export default TransactionModal;
