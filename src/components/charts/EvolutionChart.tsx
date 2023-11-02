import { useBearStore } from "../../GlobalState";
import { FormatDateWithoutHours } from "../../Utils";
import { ChartFrequency } from "../../account";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type EvolutionChartProps = {
  frequency: ChartFrequency;
  transactions?: string[];
  title?: string;
};

const EvolutionChart = ({
  frequency,
  transactions,
  title,
}: EvolutionChartProps) => {
  const { account } = useBearStore();

  const options: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: title || `Balance Evolution by ${frequency}`,
      },
    },
  };

  const GetBalanceAtDay = (day: string) => {
    let date = new Date(day);
    date.setDate(date.getDate() + 1);

    let result = 0;
    account!.transactions.forEach((t) => {
      let cdate = new Date(t.date);
      if (cdate < date) {
        result += t.amount;
      }
    });

    return result;
  };

  const GenerateData = () => {
    const labels: string[] = [];
    const data: number[] = [];

    switch (frequency) {
      case "Days":
      case "Weeks":
      case "Months":
      case "Years":
        // Get Date With Transaction
        let datesWithTransactions: string[] = [];
        account!.transactions.forEach((t) => {
          if (!transactions || (transactions && transactions.includes(t.id))) {
            let currentDate = new Date(t.date);
            if (!datesWithTransactions.includes(currentDate.toDateString()))
              datesWithTransactions.push(currentDate.toDateString());
          }
        });

        datesWithTransactions.forEach((d) => {
          labels.push(FormatDateWithoutHours(new Date(d).getTime()));
          data.push(GetBalanceAtDay(d));
        });
        break;
    }

    return {
      labels,
      datasets: [
        {
          label: "Balance",
          data,
          borderColor: "#6366F1",
          backgroundColor: "#6366F1",
          tension: 0.1,
        },
      ],
    };
  };

  return (
    <div className="w-full h-full p-4">
      {account ? (
        <Line options={options} data={GenerateData()} className="w-full h-full"></Line>
      ) : (
        <p className="text-text-color">Loading...</p>
      )}
    </div>
  );
};

export default EvolutionChart;
