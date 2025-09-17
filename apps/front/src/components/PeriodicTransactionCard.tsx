import { Transaction } from "@finance-tracker/types";
import { periodicRuleStringify } from "../Utils";
import FTButton from "./FTButton";
import { useModal } from "./ModalProvider";
import TransactionsTable from "./TransactionsTable";

const PeriodicTransactionCard = ({
  transaction,
  editTransaction,
  deleteTransaction,
}: {
  transaction: Transaction;
  editTransaction: (txId: string) => void;
  deleteTransaction: (txId: string) => void;
}) => {
  const { showModal } = useModal();
  return transaction.periodic ? (
    <div
      key={transaction.id}
      className="rounded-lg p-4 text-active-text-color border-text-color border flex flex-col gap-2 w-fit max-w-[calc(50%)] mobile:max-w-full"
    >
      <TransactionsTable
        transactions={[transaction]}
        config={{
          allowScroll: false,
          fields: ["name", "date", "tag", "amount"],
          showHeader: false,
          tableClassName: "!m-0",
          fieldsClassName: [
            {
              field: "name",
              className: "!p-0",
            },
          ],
        }}
      />

      <div className="flex flex-row justify-between items-center mt-2">
        <p>{periodicRuleStringify(transaction)}</p>
        <div className="flex gap-2">
          <FTButton
            className="!p-0 h-8 w-8 flex items-center justify-center"
            onClick={() => editTransaction(transaction.id)}
          >
            <img
              className="w-4"
              src="/components/edit.svg"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </FTButton>
          <FTButton
            className="!p-0 h-8 w-8 flex items-center justify-center bg-red"
            onClick={() =>
              showModal({
                type: "Boolean",
                title: "Are you sure you want to delete this transaction?",
                confirmText: "Delete Transaction",
                cancelText: "Cancel",
                callback: () => {
                  deleteTransaction(transaction.id);
                },
              })
            }
          >
            <img
              className="w-4"
              src="/components/trash.svg"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </FTButton>
        </div>
      </div>
    </div>
  ) : null;
};

export default PeriodicTransactionCard;
