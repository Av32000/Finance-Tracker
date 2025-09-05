import { useEffect } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import { useBearStore } from "../GlobalState";

const Scheduled = () => {
  const { account } = useBearStore();

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
          </div>
          <div className="p-4 flex flex-col gap-6 overflow-y-scroll mobile:pb-40"></div>
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
