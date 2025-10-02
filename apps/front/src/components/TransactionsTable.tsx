import { Transaction } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import { FormatDate } from "../Utils";
import AmountTag from "./AmountTag";
import FTCheckbox from "./FTCheckbox";
import FTSelect from "./FTSelect";
import FileTag from "./FileTag";
import TransactionTagElement from "./TransactionTagElement";

type TransactionTableConfig = {
  showHeader?: boolean;
  fields?: ("name" | "files" | "date" | "tag" | "amount")[];
  selected?: string[];
  setSelected?: ((selected: string[]) => void) | null;
  onTransactionClick?: ((transactionId: string) => void) | null;
  dateFormat?: ((date: number) => string) | null;
  allowScroll?: boolean;
  tableClassName?: string;
  fieldsClassName?: { field: string; className: string }[];
  allowStats?: boolean;
};

const defaultConfig: TransactionTableConfig = {
  showHeader: true,
  fields: ["name", "files", "date", "tag", "amount"],
  selected: [],
  setSelected: null,
  onTransactionClick: null,
  dateFormat: null,
  allowScroll: true,
  tableClassName: "",
  fieldsClassName: [],
  allowStats: true,
};

const statsOptions = [
  {
    name: "Sum",
    func: (transactions: Transaction[]) =>
      Number(
        transactions
          .reduce((acc, t) => acc + t.amount, 0)
          .toFixed(2)
          .padEnd(2, "0"),
      ),
  },
  {
    name: "Average",
    func: (transactions: Transaction[]) =>
      transactions.length === 0
        ? 0
        : Number(
            (
              transactions.reduce((acc, t) => acc + t.amount, 0) /
              transactions.length
            )
              .toFixed(2)
              .padEnd(2, "0"),
          ),
  },
  {
    name: "Count",
    func: (transactions: Transaction[]) => transactions.length,
  },
  {
    name: "Max",
    func: (transactions: Transaction[]) =>
      transactions.length === 0
        ? 0
        : Number(
            Math.max(...transactions.map((t) => t.amount))
              .toFixed(2)
              .padEnd(2, "0"),
          ),
  },
  {
    name: "Min",
    func: (transactions: Transaction[]) =>
      transactions.length === 0
        ? 0
        : Number(
            Math.min(...transactions.map((t) => t.amount))
              .toFixed(2)
              .padEnd(2, "0"),
          ),
  },
  {
    name: "Median",
    func: (transactions: Transaction[]) => {
      if (transactions.length === 0) return 0;
      const sorted = [...transactions]
        .map((t) => t.amount)
        .sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      return Number(median.toFixed(2).padEnd(2, "0"));
    },
  },
];

const TransactionsTable = ({
  transactions,
  config = {},
}: {
  transactions: Transaction[];
  config?: TransactionTableConfig;
}) => {
  const { account } = useBearStore();

  const [renderedFields, setRenderedFields] = useState<string[]>([]);

  // Merge provided config with default config
  const mergedConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    const fields =
      mergedConfig.fields && mergedConfig.fields.length > 0
        ? [...mergedConfig.fields]
        : ["name", "files", "date", "tag", "amount"];

    if (mergedConfig.setSelected && !fields.includes("select"))
      fields.push("select");

    setRenderedFields(fields);
  }, [mergedConfig.fields, mergedConfig.setSelected]);

  return (
    <>
      <div
        className={`m-4 ${mergedConfig.allowScroll ? "overflow-y-scroll" : "overflow-y-hidden"} ${mergedConfig.tableClassName}`}
      >
        {account ? (
          <table className={`table-fixed w-full border-spacing-y-px`}>
            {mergedConfig.showHeader && (
              <thead className="border-b-[1px] p-4 border-text-color">
                <tr className="text-active-text-color">
                  {renderedFields.includes("select") && (
                    <th className="w-7">
                      <FTCheckbox
                        checked={
                          mergedConfig.selected?.length === transactions.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            mergedConfig.setSelected?.(
                              transactions.map((t) => t.id),
                            );
                          } else {
                            mergedConfig.setSelected?.([]);
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
              <>
                {
                  // TODO : Add ScrollBar
                  [...transactions]
                    .sort((a, b) => b.date - a.date)
                    .map((t) => {
                      return (
                        <tr
                          key={t.id}
                          className={
                            mergedConfig.onTransactionClick
                              ? `hover:bg-bg-light ${mergedConfig.selected?.indexOf(t.id) != -1 ? "bg-bg-light" : ""}`
                              : ""
                          }
                        >
                          {renderedFields.includes("select") && (
                            <td
                              className={`w-7 ${mergedConfig.fieldsClassName?.find((f) => f.field === "select")?.className}`}
                            >
                              <FTCheckbox
                                checked={
                                  mergedConfig.selected?.indexOf(t.id) != -1
                                }
                                onChange={(e) => {
                                  if (
                                    e.target.checked &&
                                    mergedConfig.selected?.indexOf(t.id) == -1
                                  )
                                    mergedConfig.setSelected?.([
                                      ...mergedConfig.selected,
                                      t.id,
                                    ]);
                                  if (
                                    !e.target.checked &&
                                    mergedConfig.selected?.indexOf(t.id) != -1
                                  )
                                    mergedConfig.setSelected?.(
                                      mergedConfig.selected?.filter(
                                        (i) => i !== t.id,
                                      ) || [],
                                    );
                                }}
                              />
                            </td>
                          )}
                          {renderedFields.includes("name") && (
                            <td
                              className={`text-start text-active-text-color p-2 ${mergedConfig.onTransactionClick ? "cursor-pointer" : ""} truncate ${mergedConfig.fieldsClassName?.find((f) => f.field === "name")?.className}`}
                              onClick={() => {
                                if (mergedConfig.onTransactionClick) {
                                  mergedConfig.onTransactionClick(t.id);
                                }
                              }}
                            >
                              {t.name}
                            </td>
                          )}
                          {renderedFields.includes("files") && (
                            <td
                              className={
                                mergedConfig.fieldsClassName?.find(
                                  (f) => f.field === "files",
                                )?.className
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
                              className={`text-center text-text-color ${mergedConfig.fieldsClassName?.find((f) => f.field === "date")?.className}`}
                            >
                              {mergedConfig.dateFormat
                                ? mergedConfig.dateFormat(t.date)
                                : FormatDate(t.date)}
                            </td>
                          )}
                          {renderedFields.includes("tag") && (
                            <td
                              className={`text-center text-active-text-color ${mergedConfig.fieldsClassName?.find((f) => f.field === "tag")?.className}`}
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
                              className={`text-center text-active-text-color ${mergedConfig.fieldsClassName?.find((f) => f.field === "amount")?.className}`}
                            >
                              <AmountTag amount={t.amount} />
                            </td>
                          )}
                        </tr>
                      );
                    })
                }
                {mergedConfig.allowStats &&
                  renderedFields.includes("amount") && (
                    <tr
                      key="stats"
                      className="border-t-[1px] border-text-color border-opacity-10"
                    >
                      {renderedFields
                        .filter((f) => f != "amount")
                        .map((e) => (
                          <td
                            key={e}
                            className={`w-7 ${mergedConfig.fieldsClassName?.find((f) => f.field === e)?.className}`}
                          ></td>
                        ))}
                      <td key="stats-field">
                        <FTSelect className="bg-transparent border-0 text-text-color text-center w-full">
                          {statsOptions.map((option) => (
                            <option
                              key={option.name}
                              value={option.name}
                              className="bg-transparent"
                            >
                              {option.name}: {option.func(transactions)}
                            </option>
                          ))}
                        </FTSelect>
                      </td>
                    </tr>
                  )}
              </>
            </tbody>
          </table>
        ) : (
          <p>No Account</p>
        )}
      </div>
    </>
  );
};

export default TransactionsTable;
