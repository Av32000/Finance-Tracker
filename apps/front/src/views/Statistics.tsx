import { useEffect } from "react";
import { useBearStore } from "../GlobalState";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import FTChart from "../components/FTChat";
import { useModal } from "../components/ModalProvider";
import NavBar from "../components/NavBar";

const Statistics = () => {
  const { account } = useBearStore();
  const { showModal } = useModal();
  useEffect(() => {
    document.title = "Finance Tracker - Statistics";
  });

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
                  Create chart to visualise data
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              <FTButton
                className="h-10"
                onClick={() =>
                  showModal({ title: "Not implemented yet", type: "Info" })
                }
              >
                Create new Chart
              </FTButton>
            </div>
          </div>
          <div className="flex-1 h-full max-w-full">
            <div className="bg-bg h-full mobile:pb-16 flex items-center justify-center">
              <FTChart
                customOptions={{ plugins: { legend: { display: true } } }}
                chart={{
                  id: "",
                  name: "",
                  type: "Line",
                  dataBuilderConfig: {
                    filters: [],
                    groupBy: "day",
                    metrics: [
                      {
                        field: "count",
                        function: "sum",
                        cumulative: true,
                      },
                    ],
                  },
                }}
              />
            </div>
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
