import { useEffect } from "react";
import NavBar from "../components/NavBar";
import { useBearStore } from "../GlobalState";
import FTButton from "../components/FTButton";

const Statistics = () => {
  const { account } = useBearStore();
  useEffect(() => {
    document.title = "Finance Tracker - Statistics";
  });
  return (
    <div className="overflow-hidden flex">
      <NavBar />
      {account ? (
        <div className="bg-bg flex-1 h-screen flex flex-col relative">
            <div className="w-full p-4 flex flex-row justify-between">
            <div className="flex items-start">
              <img src="/pages/statistics.svg" className="w-6 m-2" />
              <div className="flex flex-col">
                <h1 className="text-active-text-color text-2xl">Statistics</h1>
                <p className="text-text-color">Creating chart to visualise data</p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
             <FTButton className="h-10">Create new Chart</FTButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 h-screen bg-bg flex items-center justify-center">
          <p className="text-2xl text-text-color">No Account</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;
