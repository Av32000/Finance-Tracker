import { FetchServerType, Transaction } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import FTInput from "../components/FTInput";
import { useModal } from "../components/ModalProvider";
import TransactionsTable from "../components/TransactionsTable";
import { useBearStore } from "../GlobalState";
import { filterTransactions, parseFilter } from "../TransactionFilter";
import { renderTransactions } from "../Utils";

const DeleteTransaction = async (
  tId: string,
  accountId: string,
  fetchServer: FetchServerType,
) => {
  if (tId.includes("#")) {
    const [transactionId, occurenceStr] = tId.split("#");
    const occurence = parseInt(occurenceStr);
    const transaction = await fetchServer(
      "/accounts/" + accountId + "/transactions/" + transactionId,
    );
    const transactionData: Transaction = await transaction.json();
    await fetchServer(
      "/accounts/" + accountId + "/transactions/" + transactionId,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: {
            ...transactionData,
            periodic: {
              ...transactionData.periodic,
              modified: [
                ...(transactionData.periodic?.modified || []),
                { occurence, value: null },
              ],
            },
          },
        }),
      },
    );
  } else {
    await fetchServer("/accounts/" + accountId + "/transactions/" + tId, {
      method: "DELETE",
    });
  }
};

const SaveTransaction = async (
  transaction: Omit<Transaction, "id">,
  accountId: string,
  fetchServer: FetchServerType,
  transactionId?: string,
): Promise<string> => {
  if (transactionId) {
    if (transactionId.includes("#")) {
      const [baseTransactionId, occurenceStr] = transactionId.split("#");
      const occurence = parseInt(occurenceStr);

      const newTransactionId = (await SaveTransaction(
        { ...transaction, periodic: null },
        accountId,
        fetchServer,
      )) as string;

      const originalTransaction = await fetchServer(
        "/accounts/" + accountId + "/transactions/" + baseTransactionId,
      );
      const transactionData: Transaction = await originalTransaction.json();
      await fetchServer(
        "/accounts/" + accountId + "/transactions/" + transactionId,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: {
              ...transactionData,
              periodic: {
                ...transactionData.periodic,
                modified: [
                  ...(transactionData.periodic?.modified || []),
                  { occurence, value: newTransactionId },
                ],
              },
            },
          }),
        },
      );

      return newTransactionId;
    } else {
      await fetchServer(
        "/accounts/" + accountId + "/transactions/" + transactionId,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction }),
        },
      );

      return transactionId;
    }
  } else {
    const response = await fetchServer(
      "/accounts/" + accountId + "/transactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction }),
      },
    );

    return await response.text();
  }
};

const Transactions = () => {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { account, setAccount, refreshAccount, fetchServer } = useBearStore();
  const { showModal } = useModal();

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get("q");
    if (filterParam) {
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
      setFilter(filterParam);
    }
  }, []);

  useEffect(() => {
    document.title = "Finance Tracker - Transactions";
  });
  return (
    <>
      {account ? (
        <div className="bg-bg flex-1 h-screen flex flex-col desktop:relative">
          <div className="w-full p-4 flex flex-row justify-between mobile:flex-col mobile:items-center">
            <div className="flex items-start mobile:mb-4 mobile:mt-2">
              <img
                src="/pages/transactions.svg"
                className="w-5 m-2 mobile:my-1"
              />
              <div className="flex flex-col">
                <h1 className="text-active-text-color text-2xl">
                  Transactions
                </h1>
                <p className="text-text-color mobile:hidden">
                  List of the registered transactions
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              {selected.length == 0 ? (
                <>
                  <FTInput
                    placeholder="Search"
                    className="h-10 mobile:w-48"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <FTButton
                    className="h-10"
                    onClick={() =>
                      showModal({
                        type: "AddTransaction",
                        saveTransaction: SaveTransaction,
                      })
                    }
                  >
                    Add Transaction
                  </FTButton>
                </>
              ) : (
                <>
                  {selected.length == 1 && (
                    <FTButton
                      className="h-10"
                      onClick={() =>
                        showModal({
                          type: "AddTransaction",
                          saveTransaction: SaveTransaction,
                          transactionId: selected[0],
                        })
                      }
                    >
                      Edit Transaction
                    </FTButton>
                  )}
                  <FTButton
                    className="h-10 bg-red"
                    onClick={() =>
                      showModal({
                        type: "Boolean",
                        title: `Are you sure you want to delete ${
                          selected.length
                        } transaction${selected.length > 1 ? "s" : ""} ?`,
                        confirmText: `Delete ${selected.length} transaction${
                          selected.length > 1 ? "s" : ""
                        }`,
                        cancelText: "Cancel",
                        callback: async () => {
                          const promises = selected.map((s) =>
                            DeleteTransaction(s, account.id, fetchServer),
                          );
                          await Promise.all(promises);
                          await refreshAccount(account.id, setAccount);
                          setSelected([]);
                        },
                      })
                    }
                  >
                    Delete Transaction{selected.length > 1 ? "s" : ""}
                  </FTButton>
                </>
              )}
            </div>
          </div>
          <TransactionsTable
            transactions={filterTransactions(
              renderTransactions(account),
              parseFilter(filter.trim(), account),
            )}
            config={{
              selected,
              setSelected,
              allowStats: true,
              onTransactionClick: (transactionId) => {
                showModal({
                  type: "TransactionDetails",
                  transactionId,
                  saveTransaction: SaveTransaction,
                  editTransaction: (tId) => {
                    showModal({
                      type: "AddTransaction",
                      saveTransaction: SaveTransaction,
                      transactionId: tId,
                    });
                  },
                  deleteTransaction: (tId) => {
                    showModal({
                      type: "Boolean",
                      title: `Are you sure you want to delete this transaction ?`,
                      confirmText: `Delete`,
                      cancelText: "Cancel",
                      callback: async () => {
                        await DeleteTransaction(tId, account.id, fetchServer);
                        await refreshAccount(account.id, setAccount);
                        setSelected((prev) => prev.filter((s) => s !== tId));
                      },
                    });
                  },
                });
              },
              fieldsClassName: [
                { field: "tag", className: "mobile:hidden" },
                { field: "files", className: "mobile:hidden" },
              ],
            }}
          />
        </div>
      ) : (
        <div className="flex-1 h-screen bg-bg flex items-center justify-center">
          <p className="text-2xl text-text-color">No Account</p>
          <div className="desktop:hidden">
            <AccountManagerCard />
          </div>
        </div>
      )}
    </>
  );
};

export default Transactions;
