import { useEffect } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import { useModal } from "../components/ModalProvider";
import PeriodicTransactionCard from "../components/PeriodicTransactionCard";
import { useBearStore } from "../GlobalState";

const Scheduled = () => {
  const { account, fetchServer, refreshAccount, setAccount } = useBearStore();
  const { showModal } = useModal();

  const deleteTransaction = async (txId: string) => {
    if (!account) return;
    await fetchServer("/accounts/" + account.id + "/transactions/" + txId, {
      method: "DELETE",
    });

    await refreshAccount(account.id, setAccount);
  };

  const editTransaction = (txId: string) => {
    showModal({ type: "AddScheduled", transactionId: txId });
  };

  useEffect(() => {
    document.title = "Finance Tracker - Scheduled";
  }, []);

  return (
    <>
      {account ? (
        <div className="bg-bg flex-1 h-screen flex flex-col desktop:relative">
          <div className="w-full p-4 flex flex-row justify-between mobile:flex-col mobile:items-center mobile:mt-2 mobile:w-screen">
            <div className="flex items-start mobile:gap-2">
              <img
                src="/pages/scheduled.svg"
                className="w-6 m-2 mobile:my-1 mobile:mx-0"
              />
              <div className="flex flex-col">
                <h1 className="text-active-text-color text-2xl">Scheduled</h1>
                <p className="text-text-color mobile:hidden">
                  Create and manage periodic transactions
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              <FTButton
                className="h-10"
                onClick={() => {
                  showModal({ type: "AddScheduled" });
                }}
              >
                Add Transaction
              </FTButton>
            </div>
          </div>
          <div className="p-4 flex gap-4 overflow-y-scroll mobile:pb-40">
            {account.transactions.filter((t) => t.periodic != null).length ===
            0 ? (
              <p className="text-text-color">No scheduled transactions</p>
            ) : (
              account.transactions
                .filter((t) => t.periodic != null)
                .map((t) => (
                  <PeriodicTransactionCard
                    key={t.id}
                    transaction={t}
                    deleteTransaction={deleteTransaction}
                    editTransaction={editTransaction}
                  />
                ))
            )}
          </div>
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

export default Scheduled;
