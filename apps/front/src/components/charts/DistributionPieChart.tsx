import { DistributionChartType } from "@ft-types/account";
import {
  ArcElement,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut, Pie } from "react-chartjs-2";
import tailwindConfig from "../../../tailwind.config";
import { useBearStore } from "../../GlobalState";

ChartJS.register(ArcElement, Tooltip, Legend);

type DistributionPieChartProps = {
  type?: DistributionChartType;
  transactions?: string[];
  tags?: string[];
};

const DistributionPieChart = ({
  type,
  transactions,
  tags,
}: DistributionPieChartProps) => {
  const { account } = useBearStore();

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

  const GenerateData = () => {
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];
    const borderColor: string[] = [];

    account!.tags.forEach((t) => {
      if (!tags || (tags && tags.includes(t.id))) {
        labels.push(t.name);
        data.push(0);
        backgroundColor.push(`${t.color}${Math.round(0.8 * 255).toString(16)}`);
        borderColor.push(t.color);
      }
    });

    account!.transactions.forEach((t) => {
      if (
        t.amount < 0 &&
        (!transactions || (transactions && transactions.includes(t.id)))
      ) {
        let tag = account!.tags.find((tag) => tag.id === t.tag);
        if (tag) {
          let index = account!.tags.indexOf(tag);
          data[index] += Math.abs(t.amount);
        }
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Expenses",
          backgroundColor,
          borderColor,
          data,
          hoverOffset: 4,
        },
      ],
    };
  };

  return (
    <div className="items-center justify-center h-full w-full p-4 max-h-full">
      {account ? (
        type == "Pie" ? (
          <Pie
            // @ts-ignore
            options={options}
            data={GenerateData()}
            className="w-full max-h-full"
          ></Pie>
        ) : (
          <Doughnut
            // @ts-ignore
            options={options}
            data={GenerateData()}
            className="w-full max-h-full"
          ></Doughnut>
        )
      ) : (
        <p className="text-text-color">Loading...</p>
      )}
    </div>
  );
};

export default DistributionPieChart;
