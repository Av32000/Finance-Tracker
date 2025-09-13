import { Transaction } from "@finance-tracker/types";
import { useState } from "react";
import { useBearStore } from "../GlobalState";
import FTButton from "./FTButton";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";
import { useModal } from "./ModalProvider";
import TransactionsTable from "./TransactionsTable";

const FTCreateScheduledModal = ({ hideModal }: { hideModal: () => void }) => {
  const { showModal } = useModal();
  const { account, setAccount, refreshAccount, fetchServer } = useBearStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [frequency, setFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [interval, setInterval] = useState<number>(1);
  const [endCondition, setEndCondition] = useState<
    "never" | "afterDate" | "afterOccurrences"
  >("never");
  const [endValue, setEndValue] = useState<Date | number | null>(null);

  return (
    <div
      className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideModal();
        }
      }}
    >
      <div className="p-10 bg-bg-light rounded-xl flex flex-col gap-4 items-center justify-center w-3/5 mobile:w-5/6">
        <p className="text-active-text-color">Create periodic transaction</p>
        {transaction != null ? (
          <TransactionsTable
            transactions={[transaction]}
            selected={[]}
            setSelected={() => {}}
            tableClassName="px-4"
            config={{
              allowClick: true,
              allowScroll: false,
              allowSelection: false,
              dateFormat: null,
              fields: ["name", "tag", "amount"],
              showHeader: true,
            }}
          />
        ) : (
          <FTButton
            onClick={() => {
              showModal({
                type: "AddTransaction",
                saveTransaction: async (transaction) => {
                  setTransaction({
                    ...transaction,
                    id: "temp-id",
                  } as Transaction);

                  return "temp-id";
                },
              });
            }}
          >
            Add Transaction
          </FTButton>
        )}
        <span className="text-active-text-color">
          Repeat every{" "}
          <FTInput
            type="number"
            min={1}
            className="w-16 text-center"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
          />{" "}
          <FTSelect
            value={frequency}
            onChange={(e) =>
              setFrequency(
                e.target.value as "daily" | "weekly" | "monthly" | "yearly",
              )
            }
          >
            <option value="daily">Day</option>
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
            <option value="yearly">Year</option>
          </FTSelect>
        </span>
        <span className="text-active-text-color">
          Ends{" "}
          <FTSelect
            value={endCondition}
            className="mr-1"
            onChange={(e) =>
              setEndCondition(
                e.target.value as "never" | "afterDate" | "afterOccurrences",
              )
            }
          >
            <option value="never">Never</option>
            <option value="afterDate">On</option>
            <option value="afterOccurrences">After</option>
          </FTSelect>
          {endCondition === "afterDate" && (
            <FTInput
              type="date"
              value={
                endValue instanceof Date
                  ? endValue.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEndValue(e.target.value ? new Date(e.target.value) : null)
              }
            />
          )}
          {endCondition === "afterOccurrences" && (
            <>
              <FTInput
                className="w-16 text-center"
                type="number"
                min={1}
                value={typeof endValue === "number" ? endValue : ""}
                onChange={(e) =>
                  setEndValue(e.target.value ? Number(e.target.value) : null)
                }
              />
              {" occurrences"}
            </>
          )}
        </span>
        <FTButton
          onClick={async () => {
            if (!transaction || !account) return;

            // Create the periodic rule based on the form inputs
            let endRule;
            if (endCondition === "never") {
              endRule = { type: "never" as const };
            } else if (
              endCondition === "afterDate" &&
              endValue instanceof Date
            ) {
              endRule = { type: "afterDate" as const, value: endValue };
            } else if (
              endCondition === "afterOccurrences" &&
              typeof endValue === "number"
            ) {
              endRule = { type: "afterOccurrences" as const, value: endValue };
            } else {
              // Default to never if invalid input
              endRule = { type: "never" as const };
            }

            const periodicTransaction = {
              ...transaction,
              periodic: {
                rule: {
                  freq: frequency,
                  interval: interval,
                  endRule: endRule,
                },
                modified: [],
              },
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...transactionData } = periodicTransaction;

            try {
              await fetchServer("/accounts/" + account.id + "/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction: transactionData }),
              });

              await refreshAccount(account.id, setAccount);

              console.log("Periodic transaction saved successfully");
              hideModal();
            } catch (error) {
              console.error("Failed to save periodic transaction:", error);
            }
          }}
        >
          Save Transaction
        </FTButton>
      </div>
    </div>
  );
};

export default FTCreateScheduledModal;
