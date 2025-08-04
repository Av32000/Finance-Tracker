import { useState } from "react";
import { useBearStore } from "../GlobalState";
import { FilterItem } from "../TransactionFilter";
import { FormatDate } from "../Utils";
import AmountTag from "./AmountTag";
import FTCheckbox from "./FTCheckbox";
import FileTag from "./FileTag";
import TransactionModal from "./TransactionModal";
import TransactionTagElement from "./TransactionTagElement";

const TransactionsTable = ({
  filter,
  selected,
  setSelected,
}: {
  filter: string;
  selected: string[];
  setSelected: (selected: string[]) => void;
}) => {
  const { account } = useBearStore();

  const [transactionModalIsOpen, setTransactionModalIsOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState("");

  return (
    <>
      <div className="m-4 overflow-y-scroll">
        {account ? (
          <table className="table-fixed w-full border-spacing-y-px">
            <thead className="border-b-[1px] p-4 border-text-color">
              <tr className="text-active-text-color">
                <th className="w-7">
                  <FTCheckbox
                    checked={
                      selected.length ===
                        account.transactions.filter((t) =>
                          FilterItem(filter.trim(), t, account),
                        ).length &&
                      account.transactions.filter((t) =>
                        FilterItem(filter.trim(), t, account),
                      ).length > 0
                        ? true
                        : false
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(
                          account.transactions
                            .filter((t) =>
                              FilterItem(filter.trim(), t, account),
                            )
                            .map((t) => t.id),
                        );
                      } else {
                        setSelected([]);
                      }
                    }}
                  />
                </th>
                <th className="font-medium p-2">Name</th>
                <th className="font-medium p-2 mobile:hidden">Files</th>
                <th className="font-medium p-2">Date</th>
                <th className="font-medium p-2 mobile:hidden">Tag</th>
                <th className="font-medium p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {
                // TODO : Add ScrollBar
                [...account.transactions]
                  .sort((a, b) => b.date - a.date)
                  .map((t) => {
                    if (!FilterItem(filter.trim(), t, account)) return;

                    return (
                      <tr
                        key={t.id}
                        className={
                          "hover:bg-bg-light" +
                          (selected.indexOf(t.id) != -1 ? "bg-bg-light" : "")
                        }
                      >
                        <td>
                          <FTCheckbox
                            checked={selected.indexOf(t.id) != -1}
                            onChange={(e) => {
                              if (
                                e.target.checked &&
                                selected.indexOf(t.id) == -1
                              )
                                setSelected([...selected, t.id]);
                              if (
                                !e.target.checked &&
                                selected.indexOf(t.id) != -1
                              )
                                setSelected(selected.filter((i) => i !== t.id));
                            }}
                          />
                        </td>
                        <td
                          className="text-start text-active-text-color p-2 cursor-pointer truncate"
                          onClick={() => {
                            setCurrentTransaction(t.id);
                            setTransactionModalIsOpen(true);
                          }}
                        >
                          {t.name}
                        </td>
                        <td className="mobile:hidden">
                          {t.file ? (
                            <FileTag file={t.file} />
                          ) : (
                            <p className="text-text-color text-center">
                              No File
                            </p>
                          )}
                        </td>
                        <td className="text-center text-text-color">
                          {FormatDate(t.date)}
                        </td>
                        <td className="text-center text-active-text-color mobile:hidden">
                          <TransactionTagElement
                            tagId={t.tag}
                            accountTags={account.tags}
                          />
                        </td>
                        <td className="text-center text-active-text-color">
                          <AmountTag amount={t.amount} />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        ) : (
          <p>No Account</p>
        )}
      </div>
      <TransactionModal
        isOpen={transactionModalIsOpen}
        setIsOpen={setTransactionModalIsOpen}
        transactionId={currentTransaction}
      />
    </>
  );
};

export default TransactionsTable;
