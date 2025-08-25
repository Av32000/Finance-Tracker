import {
  Account,
  ChartAvailableFields,
  ChartDataBuilderConfig,
  ChartDataset,
  ChartMetric,
  FTChart as FTChartType,
  Transaction,
} from "@finance-tracker/types";
import tailwindConfig from "../tailwind.config";
import { filterTransactions } from "./TransactionFilter";
import {
  FormatDateHour,
  FormatDateMonth,
  FormatDateWithoutHours,
  FormatMoney,
} from "./Utils";

type TransactionsGroup = {
  value: string;
  transactions: Transaction[];
  backgroundColor?: string;
  borderColor?: string;
};

function groupTransactions(
  transactions: Transaction[],
  groupBy: ChartAvailableFields,
  account: Account,
) {
  const groups: TransactionsGroup[] = [];
  transactions.forEach((transaction) => {
    switch (groupBy) {
      case "id":
        groups.push({ value: transaction.id, transactions: [transaction] });
        break;
      case "name": {
        const group = groups.find((g) => g.value == transaction.name);
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transaction.name,
            transactions: [transaction],
          });
        }
        break;
      }
      case "amount": {
        const group = groups.find(
          (g) => g.value == transaction.amount.toString(),
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transaction.amount.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "hour": {
        const transactionDate = new Date(transaction.date);
        const startOfHour = new Date(
          transactionDate.getFullYear(),
          transactionDate.getMonth(),
          transactionDate.getDate(),
          transactionDate.getHours(),
          0,
          0,
          0,
        ).getTime();
        const group = groups.find((g) => g.value == startOfHour.toString());
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: startOfHour.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "date":
      case "day": {
        const transactionDate = new Date(transaction.date);
        const startOfDay = new Date(
          transactionDate.getFullYear(),
          transactionDate.getMonth(),
          transactionDate.getDate(),
          0,
          0,
          0,
          0,
        ).getTime();
        const group = groups.find((g) => g.value == startOfDay.toString());
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: startOfDay.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "month": {
        const transactionDate = new Date(transaction.date);
        const startOfMonth = new Date(
          transactionDate.getFullYear(),
          transactionDate.getMonth(),
          1,
        ).getTime();
        const group = groups.find((g) => g.value == startOfMonth.toString());
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: startOfMonth.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "year": {
        const transactionDate = new Date(transaction.date);
        const startOfYear = new Date(
          transactionDate.getFullYear(),
          0,
          1,
          0,
          0,
          0,
          0,
        ).getTime();
        const group = groups.find((g) => g.value == startOfYear.toString());
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: startOfYear.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "tag": {
        // Handle empty tags array - group all transactions with no tags together
        const tagValue =
          transaction.tags.length === 0 ? "no_tag" : transaction.tags.at(0);
        const group = groups.find((g) => g.value == tagValue);
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: tagValue || "no_tag",
            transactions: [transaction],
          });
        }
        break;
      }
    }
  });

  switch (groupBy) {
    case "amount":
    case "date":
    case "hour":
    case "day":
    case "month":
    case "year":
      groups.sort((a, b) => parseInt(a.value) - parseInt(b.value));
      break;
  }

  for (const group of groups) {
    switch (groupBy) {
      case "amount":
        group.value = FormatMoney(parseInt(group.value)) + " €";
        break;
      case "date":
        group.value = FormatDateWithoutHours(parseInt(group.value));
        break;
      case "hour":
        group.value = FormatDateHour(parseInt(group.value));
        break;
      case "day":
        group.value = FormatDateWithoutHours(parseInt(group.value));
        break;
      case "month":
        group.value = FormatDateMonth(parseInt(group.value));
        break;
      case "year":
        group.value = new Date(parseInt(group.value)).getFullYear().toString();
        break;
      case "tag": {
        const tag = account.tags.find((tag) => tag.id === group.value);

        group.value = tag?.name || "No Tag";
        if (tag) {
          group.backgroundColor = `${tag.color}${Math.round(0.8 * 255).toString(
            16,
          )}`;
          group.borderColor = tag.color;
        }
        break;
      }
    }
  }

  return groups;
}

function buildDatasets(
  groups: TransactionsGroup[],
  metrics: ChartMetric[],
  accoutTransactions: Transaction[],
) {
  const datasets: ChartDataset[] = [];
  let labels: string[] = [];

  for (const metric of metrics) {
    const backgroundColor: string[] = [];
    const borderColor: string[] = [];

    let name = metric.field;
    name = name.charAt(0).toUpperCase() + name.slice(1);

    labels = [];
    const data: number[] = [];

    for (const group of groups) {
      const transactions = filterTransactions(
        group.transactions,
        metric.filters,
      );
      let values;
      switch (metric.field) {
        case "amount": {
          values = transactions.map((t) => t.amount);
          break;
        }
        case "balance": {
          values = transactions.map((t) =>
            accoutTransactions
              .filter((at) => at.date <= t.date)
              .map((at) => at.amount)
              .reduce((p, a) => p + a, 0),
          );
          break;
        }
        case "count":
          values = [transactions.length];
          break;
      }

      let finalValue;
      switch (metric.function) {
        case "void":
          finalValue = values[0];
          break;
        case "count":
          finalValue = values.length;
          if (metric.cumulative && data.length > 0)
            finalValue += data.at(-1) as number;
          break;
        case "sum":
          finalValue = values.reduce((p, a) => p + a, 0);
          if (metric.cumulative && data.length > 0)
            finalValue += data.at(-1) as number;
          break;
        case "average":
          finalValue = values.reduce((p, a) => p + a, 0) / values.length;
          if (metric.cumulative && data.length > 0) {
            const elems = [finalValue, ...data];
            finalValue = elems.reduce((p, a) => p + a, 0) / elems.length;
          }
          break;
      }

      labels.push(group.value);
      data.push(finalValue);
      backgroundColor.push(
        group.backgroundColor ||
          `${metric.color || tailwindConfig.theme.colors["cta-primarly"]}${Math.round(
            0.8 * 255,
          ).toString(16)}`,
      );
      borderColor.push(
        group.borderColor ||
          metric.color ||
          tailwindConfig.theme.colors["cta-primarly"],
      );
    }

    datasets.push({
      label: metric.name || name,
      data,
      backgroundColor,
      borderColor,
    });
  }

  return { labels, datasets };
}

export function buildFilterFromChartClick(
  chart: FTChartType,
  label: string,
  account: Account,
) {
  const result = [];

  switch (chart.dataBuilderConfig.groupBy) {
    case "id":
      result.push(`@id=${label}`);
      break;
    case "name":
      result.push(`@name="${label}"`);
      break;
    case "tag":
      result.push(`@tag="${label == "No Tag" ? "" : label}"`);
      break;
    case "amount":
      result.push(`@amount=${label}`);
      break;
    case "year": {
      result.push(`@year=${label}`);
      break;
    }
    case "month": {
      const [monthName, year] = label.split(" ");
      result.push(`@year=${year} @month=${monthName}`);
      break;
    }
    case "day":
    case "date": {
      const dayDate = new Date(label);
      result.push(
        `@year=${dayDate.getFullYear()} @month=${dayDate.getMonth() + 1} @day=${dayDate.getDate()}`,
      );
      break;
    }
    case "hour": {
      // Broken
      const hourDate = new Date(label);
      result.push(
        `@year=${hourDate.getFullYear()} @month=${hourDate.getMonth() + 1} @day=${hourDate.getDate()} @hour=${hourDate.getHours()}`,
      );
      break;
    }
  }

  for (const filter of chart.dataBuilderConfig.filters) {
    if (filter.type === "property") {
      let operator = "";

      switch (filter.operator) {
        case "equals":
          operator = "=";
          break;
        case "not_equals":
          operator = "!=";
          break;
        case "less_than":
          operator = "<";
          break;
        case "greater_than":
          operator = ">";
          break;
        case "contains":
          operator = ":";
          break;
      }

      let value = encodeURIComponent(filter.value);
      if (filter.field === "tag") {
        value = account.tags.find((t) => t.id === filter.value)?.name || "";
      }

      result.push(`@${filter.field}${operator}"${value}"`);
    }
  }
  return result.join(" ");
}

export function BuildData(config: ChartDataBuilderConfig, account: Account) {
  const filteredTransactions = filterTransactions(
    account.transactions,
    config.filters,
  );
  const groups = groupTransactions(
    filteredTransactions,
    config.groupBy,
    account,
  );

  return buildDatasets(groups, config.metrics, account.transactions);
}
