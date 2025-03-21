import { useEffect } from "react";
import { useBearStore } from "../GlobalState";
import { FormatDate, FormatMoney } from "../Utils";
import AccountManagerCard from "../components/AccountManagerCard";
import AmountTag from "../components/AmountTag";
import FTChart from "../components/FTChart";
import NavBar from "../components/NavBar";

const Home = () => {
  const { account } = useBearStore();

  useEffect(() => {
    document.title = "Finance Tracker - Home";
  });
  return (
    <div className="overflow-hidden flex">
      <NavBar />
      {account ? (
        <div className="bg-bg flex-1 h-screen grid grid-cols-9 grid-rows-6 gap-3 p-4 overflow-scroll mobile:flex mobile:flex-col mobile:h-auto mobile:mb-16">
          <div className="bg-bg-light col-start-1 col-end-5 row-start-1 rounded-2xl flex items-center px-5 shadow-lg mobile:h-24">
            <div className="p-3 rounded-full bg-bg-dark bg-opacity-80 h-16 w-16">
              <img src="/components/banknote.svg" className="h-full" />
            </div>
            <div className="flex flex-col p-2">
              <p className="text-text-color text-xs">Your Balance</p>
              <p className="text-active-text-color text-2xl">
                {FormatMoney(account.balance)} €
              </p>
            </div>
          </div>
          <div className="bg-bg-light col-start-1 col-end-5 row-start-2 row-end-5 rounded-2xl flex p-3 shadow-lg flex-col gap-3 overflow-hidden mobile:h-80">
            <p className="text-active-text-color text-lg">Last Transactions</p>
            <div
              className="flex flex-col gap-3 overflow-hidden"
              style={{ flexFlow: "column wrap" }}
            >
              {[...account.transactions]
                .sort((a, b) => b.date - a.date)
                .slice(0, 19)
                .map((t) => (
                  <div
                    className="flex flex-row justify-between w-full"
                    key={t.id}
                  >
                    <p className="text-text-color">
                      {t.name} - {FormatDate(t.date).split(" ")[0]}
                    </p>
                    <AmountTag amount={t.amount} />
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-bg-light col-start-5 col-end-10 row-start-1 row-end-4 rounded-2xl flex flex-col p-3 shadow-lg mobile:h-96">
            <p className="text-active-text-color">Expenses Sources</p>
            <div className="w-full h-full p-3 mobile:pb-3">
              <FTChart
                chart={{
                  id: "",
                  name: "",
                  type: "Pie",
                  dataBuilderConfig: {
                    filters: [
                      {
                        type: "property",
                        field: "amount",
                        operator: "less_than",
                        value: "0",
                      },
                      {
                        type: "property",
                        field: "tag",
                        operator: "not_equals",
                        value: "no_tag",
                      },
                    ],
                    groupBy: "tag",
                    metrics: [
                      {
                        filters: [],
                        field: "amount",
                        function: "sum",
                        cumulative: false,
                      },
                    ],
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-bg-light col-start-1 col-end-5 row-start-5 row-end-7 rounded-2xl flex flex-col p-3 shadow-lg">
            <p className="text-active-text-color text-lg">Monthly Budget</p>
            {account.monthly > 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 w-full desktop:h-full desktop:justify-between mobile:grid-cols-1 mobile:w-auto mobile:mx-auto sm:gap-2">
                  <div className="flex items-center p-1">
                    <div className="rounded-full bg-bg-dark bg-opacity-80 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center shrink-0">
                      <img
                        src="/components/statistics.svg"
                        className="h-1/2"
                        alt="Statistics"
                      />
                    </div>
                    <div className="flex flex-col pl-2">
                      <p className="text-text-color text-xs">Percentage Used</p>
                      <p className="text-active-text-color text-xl sm:text-lg">
                        {(
                          (account.currentMonthly * 100) /
                          account.monthly
                        ).toFixed(0)}{" "}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-1">
                    <div className="rounded-full bg-bg-dark bg-opacity-80 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center shrink-0">
                      <img
                        src="/components/used.svg"
                        className="h-1/2"
                        alt="Used"
                      />
                    </div>
                    <div className="flex flex-col pl-2">
                      <p className="text-text-color text-xs">Used</p>
                      <p className="text-active-text-color text-xl sm:text-lg">
                        {FormatMoney(account.currentMonthly)} €
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-1">
                    <div className="rounded-full bg-bg-dark bg-opacity-80 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center shrink-0">
                      <img
                        src="/components/monthly.svg"
                        className="h-1/2"
                        alt="Monthly"
                      />
                    </div>
                    <div className="flex flex-col pl-2">
                      <p className="text-text-color text-xs">Monthly Budget</p>
                      <p className="text-active-text-color text-xl sm:text-lg">
                        {FormatMoney(account.monthly)} €
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-1">
                    <div className="rounded-full bg-bg-dark bg-opacity-80 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center shrink-0">
                      <img
                        src="/components/coin.svg"
                        className="h-1/2"
                        alt="Coin"
                      />
                    </div>
                    <div className="flex flex-col pl-2">
                      <p className="text-text-color text-xs">Remaining</p>
                      <p className="text-active-text-color text-xl sm:text-lg">
                        {FormatMoney(account.monthly - account.currentMonthly)}{" "}
                        €
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-text-color">Monthly Budget not set</p>
              </div>
            )}
          </div>
          <div className="bg-bg-light col-start-5 col-end-10 row-start-4 row-end-7 rounded-2xl flex flex-col py-3 shadow-lg mobile:h-80 px-0">
            <p className="text-active-text-color px-3">Balance Evolution</p>
            <div className="p-2 h-full">
              <FTChart
                customOptions={{
                  legend: false,
                }}
                chart={{
                  id: "",
                  name: "",
                  type: "Line",
                  dataBuilderConfig: {
                    filters: [
                      {
                        type: "sort",
                        field: "date",
                        order: "asc",
                      },
                    ],
                    groupBy: "day",
                    metrics: [
                      {
                        field: "balance",
                        function: "void",
                        cumulative: false,
                        filters: [],
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

export default Home;
