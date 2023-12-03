import { ChartFrequency, DistributionChartType } from "./account";

type ChartProps = {
  EvolutionChart: {
    frequency: {
      type: "option";
      values: ChartFrequency[];
      default: ChartFrequency;
    };
  };
  DistributionPieChart: {
    distributionType: {
      type: "option";
      values: DistributionChartType[];
      default: DistributionChartType;
    };
  };
};

export const ChartProps: ChartProps = {
  EvolutionChart: {
    frequency: {
      type: "option",
      values: ["Days", "Weeks", "Months", "Years"],
      default: "Days",
    },
  },
  DistributionPieChart: {
    distributionType: {
      type: "option",
      values: ["Doughnut", "Pie"],
      default: "Doughnut",
    },
  },
};
