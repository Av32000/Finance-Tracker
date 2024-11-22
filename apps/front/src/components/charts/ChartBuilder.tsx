import {
  ChartFrequency,
  DistributionChartType,
  FTChart,
} from "@ft-types/account";
import { useEffect, useState } from "react";
import { ChartProps } from "../../ChartProps";
import { useBearStore } from "../../GlobalState";
import { FilterTransactions } from "../../Utils";
import DistributionPieChart from "./DistributionPieChart";
import EvolutionChart from "./EvolutionChart";

const ChartBuilder = ({ chart }: { chart: FTChart }) => {
  const { account } = useBearStore();
  const [transactions, setTransactions] = useState<string[]>([]);

  useEffect(() => {
    if (account) {
      setTransactions(FilterTransactions(account, chart.filter));
    }
  }, [chart, account]);

  return (
    <div className="flex items-center justify-center h-full max-h-full max-w-full">
      {chart.type === "EvolutionChart" && (
        <EvolutionChart
          frequency={
            (chart.options?.find((o) => o.name === "frequency")
              ?.value as ChartFrequency) ||
            ChartProps.EvolutionChart.frequency.default
          }
          transactions={transactions}
        />
      )}
      {chart.type === "DistributionPieChart" && (
        <DistributionPieChart
          type={
            (chart.options?.find((o) => o.name === "distributionType")
              ?.value as DistributionChartType) ||
            ChartProps.DistributionPieChart.distributionType.default
          }
          transactions={transactions}
        />
      )}
    </div>
  );
};

export default ChartBuilder;
