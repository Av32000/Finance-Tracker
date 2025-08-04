import { FetchServerType } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import AddTransactionModal from "../components/AddTransactionModal";
import FTButton from "../components/FTButton";
import FTInput from "../components/FTInput";
import { useModal } from "../components/ModalProvider";
import NavBar from "../components/NavBar";
import TransactionsTable from "../components/TransactionsTable";
import { useBearStore } from "../GlobalState";

const DeleteTransaction = async (
  tId: string,
  accountId: string,
  fetchServer: FetchServerType,
) => {
  await fetchServer("/accounts/" + accountId + "/transactions/" + tId, {
    method: "DELETE",
  });
};

const Transactions = () => {
  const [addNewTransactionModalIsOpen, setAddNewTransactionModalIsOpen] =
    useState(false);
  const [editTransactionModalIsOpen, setEditTransactionModalIsOpen] =
    useState(false);
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
    <div className="overflow-hidden flex">
      <NavBar />
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
                    onClick={() => setAddNewTransactionModalIsOpen(true)}
                  >
                    Add Transaction
                  </FTButton>
                </>
              ) : (
                <>
                  {selected.length == 1 && (
                    <FTButton
                      className="h-10"
                      onClick={() => setEditTransactionModalIsOpen(true)}
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
            filter={filter}
            selected={selected}
            setSelected={setSelected}
          />
          <AddTransactionModal
            setIsOpen={setAddNewTransactionModalIsOpen}
            isOpen={addNewTransactionModalIsOpen}
          />
          <AddTransactionModal
            setIsOpen={setEditTransactionModalIsOpen}
            isOpen={editTransactionModalIsOpen}
            transactionId={selected[0]}
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
    </div>
  );
};

export default Transactions;
