import { ChartDataset, FTChart as FTChartType } from "@finance-tracker/types";
import {
  ArcElement,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import tailwindConfig from "../../tailwind.config";
import { BuildData } from "../ChartDataBuilder";
import { useBearStore } from "../GlobalState";

ChartJS.register(ArcElement, Tooltip, Legend);

const FTChart = ({ chart }: { chart: FTChartType }) => {
  const { account } = useBearStore();
  const [data, setData] = useState<{
    labels: string[];
    datasets: ChartDataset[];
  }>({ labels: [], datasets: [] });

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: tailwindConfig.theme.colors["text-color"] },
        position: "bottom",
      },
      tooltip: {
        displayColors: false,
      },
    },
  };

  useEffect(() => {
    if (account) {
      setData(BuildData(chart.dataBuilderConfig, account));
    }
  }, [chart, account]);

  return account != null ? (
    chart.type === "Pie" && (
      <Pie
        // @ts-expect-error Current options object is valid
        options={options}
        data={data}
        className="w-full max-h-full"
      ></Pie>
    )
  ) : (
    <div>
      <p>No Account</p>
    </div>
  );
};

export default FTChart;
