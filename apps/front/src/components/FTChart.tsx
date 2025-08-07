import { ChartDataset, FTChart as FTChartType } from "@finance-tracker/types";
import {
  ActiveElement,
  ChartEvent,
  Chart as ChartJS,
  ChartOptions,
  registerables,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import tailwindConfig from "../../tailwind.config";
import { BuildData, buildFilterFromChartClick } from "../ChartDataBuilder";
import { useBearStore } from "../GlobalState";

ChartJS.register(...registerables);

const FTChart = ({
  chart,
  customOptions,
}: {
  chart: FTChartType;
  customOptions?: { legend?: boolean };
}) => {
  const { account } = useBearStore();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    labels: string[];
    datasets: ChartDataset[];
  }>({ labels: [], datasets: [] });

  const handleChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const label = data.labels[elementIndex];
      const filterString = buildFilterFromChartClick(chart, label, account!);
      navigate(`/transactions?q=${encodeURIComponent(filterString)}`);
    }
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
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

  if (customOptions && customOptions.legend != null) {
    options.plugins!.legend!.display = customOptions.legend;
  }

  useEffect(() => {
    if (account) {
      setData(BuildData(chart.dataBuilderConfig, account));
    }
  }, [chart, account]);

  if (account != null) {
    if (data.datasets.every((d) => d.data.length == 0)) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-text-color">No Data collected</p>
        </div>
      );
    } else {
      switch (chart.type) {
        case "Doughnut":
          return (
            <Doughnut
              // @ts-expect-error Current options object is valid
              options={options}
              data={data}
              className="w-full max-h-full"
            ></Doughnut>
          );
        case "Bar":
          return (
            <Bar
              // @ts-expect-error Current options object is valid
              options={options}
              data={data}
              className="w-full max-h-full"
            ></Bar>
          );
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
