import { Transaction } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import { FormatDate } from "../Utils";
import AmountTag from "./AmountTag";
import FTCheckbox from "./FTCheckbox";
import FileTag from "./FileTag";
import TransactionModal from "./TransactionModal";
import TransactionTagElement from "./TransactionTagElement";

type TransactionTableConfig = {
  showHeader: boolean;
  fields: ("name" | "files" | "date" | "tag" | "amount")[];
  allowSelection: boolean;
  allowClick: boolean;
  dateFormat: ((date: number) => string) | null;
  allowScroll: boolean;
};

const defaultConfig: TransactionTableConfig = {
  showHeader: true,
  fields: ["name", "files", "date", "tag", "amount"],
  allowSelection: true,
  allowClick: true,
  dateFormat: null,
  allowScroll: true,
};

const TransactionsTable = ({
  transactions,
  selected,
  setSelected,
  config = defaultConfig,
  tableClassName,
  fieldsClassName,
}: {
  transactions: Transaction[];
  selected: string[];
  setSelected: (selected: string[]) => void;
  config?: TransactionTableConfig;
  tableClassName?: string;
  fieldsClassName?: { field: string; className: string }[];
}) => {
  const { account } = useBearStore();

  const [transactionModalIsOpen, setTransactionModalIsOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState("");
  const [renderedFields, setRenderedFields] = useState<string[]>([]);

  useEffect(() => {
    const fields =
      config.fields.length > 0
        ? config.fields
        : ["name", "files", "date", "tag", "amount"];

    if (config.allowSelection && !fields.includes("select"))
      fields.push("select");

    setRenderedFields(fields);
  }, [config.fields, config.allowSelection]);

  return (
    <>
      <div
        className={`m-4 ${config.allowScroll ? "overflow-y-scroll" : "overflow-y-hidden"} ${tableClassName}`}
      >
        {account ? (
          <table className={`table-fixed w-full border-spacing-y-px`}>
            {config.showHeader && (
              <thead className="border-b-[1px] p-4 border-text-color">
                <tr className="text-active-text-color">
                  {renderedFields.includes("select") && (
                    <th className="w-7">
                      <FTCheckbox
                        checked={selected.length === transactions.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelected(transactions.map((t) => t.id));
                          } else {
                            setSelected([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  {renderedFields.includes("name") && (
                    <th className="font-medium p-2">Name</th>
                  )}
                  {renderedFields.includes("files") && (
                    <th className="font-medium p-2">Files</th>
                  )}
                  {renderedFields.includes("date") && (
                    <th className="font-medium p-2">Date</th>
                  )}
                  {renderedFields.includes("tag") && (
                    <th className="font-medium p-2">Tag</th>
                  )}
                  {(renderedFields.includes("amount") ||
                    renderedFields.length == 0) && (
                    <th className="font-medium p-2">Amount</th>
                  )}
                </tr>
              </thead>
            )}
            <tbody>
              {
                // TODO : Add ScrollBar
                [...transactions]
                  .sort((a, b) => b.date - a.date)
                  .map((t) => {
                    return (
                      <tr
                        key={t.id}
                        className={
                          config.allowClick
                            ? `hover:bg-bg-light ${selected.indexOf(t.id) != -1 ? "bg-bg-light" : ""}`
                            : ""
                        }
                      >
                        {renderedFields.includes("select") && (
                          <td
                            className={`w-7 ${fieldsClassName?.find((f) => f.field === "select")?.className}`}
                          >
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
                                  setSelected(
                                    selected.filter((i) => i !== t.id),
                                  );
                              }}
                            />
                          </td>
                        )}
                        {renderedFields.includes("name") && (
                          <td
                            className={`text-start text-active-text-color p-2 ${config.allowClick ? "cursor-pointer" : ""} truncate ${fieldsClassName?.find((f) => f.field === "name")?.className}`}
                            onClick={() => {
                              if (config.allowClick) {
                                setCurrentTransaction(t.id);
                                setTransactionModalIsOpen(true);
                              }
                            }}
                          >
                            {t.name}
                          </td>
                        )}
                        {renderedFields.includes("files") && (
                          <td
                            className={
                              fieldsClassName?.find((f) => f.field === "files")
                                ?.className
                            }
                          >
                            {t.file ? (
                              <FileTag file={t.file} />
                            ) : (
                              <p className="text-text-color text-center">
                                No File
                              </p>
                            )}
                          </td>
                        )}
                        {renderedFields.includes("date") && (
                          <td
                            className={`text-center text-text-color ${fieldsClassName?.find((f) => f.field === "date")?.className}`}
                          >
                            {config.dateFormat
                              ? config.dateFormat(t.date)
                              : FormatDate(t.date)}
                          </td>
                        )}
                        {renderedFields.includes("tag") && (
                          <td
                            className={`text-center text-active-text-color ${fieldsClassName?.find((f) => f.field === "tag")?.className}`}
                          >
                            {t.tags.length > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                <TransactionTagElement
                                  key={t.tags[0]}
                                  tagId={t.tags[0]}
                                  accountTags={account.tags}
                                />
                                {t.tags.length > 1 && (
                                  <span className="text-active-text-color w-7 text-center  rounded-2xl flex items-center justify-center bg-text-color h-7">
                                    +{t.tags.length - 1}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <p className="text-text-color">No Tag</p>
                            )}
                          </td>
                        )}
                        {renderedFields.includes("amount") && (
                          <td
                            className={`text-center text-active-text-color ${fieldsClassName?.find((f) => f.field === "amount")?.className}`}
                          >
                            <AmountTag amount={t.amount} />
                          </td>
                        )}
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
      {config.allowClick && (
        <TransactionModal
          isOpen={transactionModalIsOpen}
          setIsOpen={setTransactionModalIsOpen}
          transactionId={currentTransaction}
        />
      )}
    </>
  );
};

export default TransactionsTable;
