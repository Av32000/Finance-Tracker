import { FTChart } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import AccountManagerCard from "../components/AccountManagerCard";
import ChartSelector from "../components/ChartSelector";
import FTButton from "../components/FTButton";
import NavBar from "../components/NavBar";
import ChartBuilder from "../components/charts/ChartBuilder";

const Statistics = () => {
  const { account } = useBearStore();
  const [currentChart, setCurrentChart] = useState<FTChart>();
  useEffect(() => {
    document.title = "Finance Tracker - Statistics";
  });

  useEffect(() => {
    if (account && account.charts.length > 0 && !currentChart) {
      setCurrentChart(account.charts[0]);
    }
  }, [account]);

  return (
    <div className="overflow-hidden flex">
      <NavBar />
      {account ? (
        <div className="bg-bg flex-1 h-screen flex flex-col desktop:relative">
          <div className="w-full p-4 flex flex-row justify-between mobile:flex-col mobile:items-center">
            <div className="flex items-start mobile:mb-4 mobile:mt-2">
              <img
                src="/pages/statistics.svg"
                className="w-6 m-2 mobile:my-1"
              />
              <div className="flex flex-col">
                <h1 className="text-active-text-color text-2xl">Statistics</h1>
                <p className="text-text-color mobile:hidden">
                  Creating chart to visualise data
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              <FTButton className="h-10">Create new Chart</FTButton>
            </div>
          </div>
          <div className="flex-1 h-full max-w-full">
            {account.charts.length > 0 ? (
              <div className="flex flex-col h-full p-4">
                <ChartSelector
                  value={currentChart?.id}
                  onChange={(e) => {
                    setCurrentChart(
                      account.charts.find((c) => c.id === e.target.value),
                    );
                  }}
                />
                {currentChart != undefined && (
                  <ChartBuilder chart={currentChart} />
                )}
              </div>
            ) : (
              <div className="h-screen bg-bg flex items-center justify-center">
                <p className="text-2xl text-text-color mobile:mb-52">
                  No Charts
                </p>
              </div>
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
    </div>
  );
};

export default Statistics;
