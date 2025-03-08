import { ChartDataset, FTChart as FTChartType } from "@finance-tracker/types";
import { Chart as ChartJS, ChartOptions, registerables } from "chart.js";
import { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import tailwindConfig from "../../tailwind.config";
import { BuildData } from "../ChartDataBuilder";
import { useBearStore } from "../GlobalState";

ChartJS.register(...registerables);

const FTChart = ({
  chart,
  customOptions,
}: {
  chart: FTChartType;
  customOptions?: ChartOptions;
}) => {
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
    ...customOptions,
  };

  useEffect(() => {
    if (account) {
      setData(BuildData(chart.dataBuilderConfig, account));
    }
  }, [chart, account]);

  if (account != null) {
    switch (chart.type) {
      case "Pie":
        return (
          <Pie
            // @ts-expect-error Current options object is valid
            options={options}
            data={data}
            className="w-full max-h-full"
          ></Pie>
        );
      case "Line":
        return (
          <Line
            options={{
              ...options,
              scales: {
                x: {
                  ticks: {
                    color: tailwindConfig.theme.colors["text-color"],
                  },
                },
                y: {
                  type: "linear",
                  ticks: {
                    color: tailwindConfig.theme.colors["text-color"],
                  },
                },
              },
            }}
            data={data}
            className="w-full max-h-full"
          ></Line>
        );
    }
  } else {
    return (
      <div>
        <p>No Account</p>
      </div>
    );
  }
};

export default FTChart;
