import { FTChart as FTChartType } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import FTChart from "../components/FTChart";
import FTSelect from "../components/FTSelect";
import { useModal } from "../components/ModalProvider";

const Statistics = () => {
  const { account, fetchServer, refreshAccount, setAccount } = useBearStore();
  const { showModal } = useModal();

  const [currentChartId, setCurrentChartId] = useState("");

  useEffect(() => {
    document.title = "Finance Tracker - Statistics";
  });

  useEffect(() => {
    if (
      account &&
      account.charts.length > 0 &&
      account.charts.find((c) => c.id === currentChartId) == null
    )
      setCurrentChartId(account.charts[0].id);
  }, [account, currentChartId]);

  return (
    <>
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
                  Create chart to visualise data
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              <FTButton
                className="h-10"
                onClick={() => showModal({ type: "Chart" })}
              >
                Create new Chart
              </FTButton>
            </div>
          </div>
          <div className="flex-1 max-w-full">
            {account.charts.length > 0 ? (
              <div className="p-2 h-full mobile:h-[calc(100%-64px)] flex flex-col gap-4">
                <div className="flex flex-row gap-4 px-2">
                  <FTSelect
                    value={currentChartId}
                    onChange={(e) => setCurrentChartId(e.target.value)}
                    className="w-full text-start"
                  >
                    {account.charts.map((chart) => (
                      <option value={chart.id} key={chart.id}>
                        {chart.name}
                      </option>
                    ))}
                  </FTSelect>
                  <img
                    src="/components/edit.svg"
                    className="w-6 cursor-pointer"
                    onClick={() =>
                      showModal({ type: "Chart", chartId: currentChartId })
                    }
                  />
                  <img
                    src="/components/trash.svg"
                    className="w-6 cursor-pointer"
                    onClick={() => {
                      showModal({
                        type: "Boolean",
                        title: `Are you sure you want to delete ${account.charts.find((c) => c.id === currentChartId)?.name} ?`,
                        cancelText: "Cancel",
                        confirmText: "Delete Chart",
                        callback: () => {
                          fetchServer(
                            `/accounts/${account.id}/charts/${currentChartId}`,
                            {
                              method: "DELETE",
                            },
                          ).then((res) => {
                            if (res.ok) refreshAccount(account.id, setAccount);
                            else console.error("Unable to delete chart");
                          });
                        },
                      });
                    }}
                  />
                </div>
                {account.charts.find((c) => c.id === currentChartId) && (
                  <div className="flex-1 w-full h-full">
                    <FTChart
                      chart={
                        account.charts.find(
                          (c) => c.id === currentChartId,
                        ) as FTChartType
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-bg h-full mobile:pb-16 flex items-center justify-center">
                <p className="text-2xl text-text-color">No Charts</p>
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
    </>
  );
};

export default Statistics;
