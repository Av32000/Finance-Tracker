import {
  Account,
  ChartAvailableFields,
  ChartDataBuilderConfig,
  ChartDataset,
  ChartMetric,
  Transaction,
  TransactionsFilter,
} from "@finance-tracker/types";
import tailwindConfig from "../tailwind.config";
import {
  FormatDate,
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

function filterTransactions(
  transactions: Transaction[],
  filters: TransactionsFilter[]
) {
  let currentResult = transactions;

  for (const filter of filters) {
    if (filter.type == "property") {
      const newResult: Transaction[] = [];
      currentResult.forEach((transaction) => {
        let propsValue;
        switch (filter.field) {
          case "id":
            propsValue = transaction.id;
            break;
          case "name":
            propsValue = transaction.name;
            break;
          case "amount":
            propsValue = transaction.amount;
            break;
          case "date":
            propsValue = transaction.date;
            break;
          case "hour":
            propsValue = new Date(transaction.date).getHours();
            break;
          case "day":
            propsValue = new Date(transaction.date).getDate();
            break;
          case "month":
            propsValue = new Date(transaction.date).getMonth();
            break;
          case "year":
            propsValue = new Date(transaction.date).getFullYear();
            break;
          case "tag":
            propsValue = transaction.tag;
            break;
        }

        switch (filter.operator) {
          case "equals":
            if (propsValue === filter.value) newResult.push(transaction);
            break;
          case "greater_than":
            if (propsValue > filter.value) newResult.push(transaction);
            break;
          case "less_than":
            if (propsValue < filter.value) newResult.push(transaction);
            break;
          case "between":
            if (propsValue > filter.value[0] && propsValue < filter.value[1])
              newResult.push(transaction);
            break;
          case "contains":
            if ((propsValue as string).includes(filter.value))
              newResult.push(transaction);
            break;
        }
      });

      currentResult = newResult;
    } else {
      currentResult.sort((a, b) => {
        switch (filter.field) {
          case "name":
            if (filter.order == "asc") {
              return a.name.localeCompare(b.name);
            } else {
              return b.name.localeCompare(a.name);
            }
          case "amount":
            if (filter.order == "asc") {
              return a.amount - b.amount;
            } else {
              return b.amount - a.amount;
            }
          case "date":
            if (filter.order == "asc") {
              return a.date - b.date;
            } else {
              return b.date - a.date;
            }
          case "hour":
            if (filter.order == "asc") {
              return new Date(a.date).getHours() - new Date(b.date).getHours();
            } else {
              return new Date(b.date).getHours() - new Date(a.date).getHours();
            }
          case "day":
            if (filter.order == "asc") {
              return new Date(a.date).getDate() - new Date(b.date).getDate();
            } else {
              return new Date(b.date).getDate() - new Date(a.date).getDate();
            }
          case "month":
            if (filter.order == "asc") {
              return new Date(a.date).getMonth() - new Date(b.date).getMonth();
            } else {
              return new Date(b.date).getMonth() - new Date(a.date).getMonth();
            }
          case "year":
            if (filter.order == "asc") {
              return (
                new Date(a.date).getFullYear() - new Date(b.date).getFullYear()
              );
            } else {
              return (
                new Date(b.date).getFullYear() - new Date(a.date).getFullYear()
              );
            }
          case "id":
          case "tag":
            return 1; // Not applicable
        }
      });

      if (filter.limit && filter.limit > 0) {
        currentResult = currentResult.slice(0, filter.limit);
      }
    }
  }

  return currentResult;
}

function groupTransactions(
  transactions: Transaction[],
  groupBy: ChartAvailableFields,
  account: Account
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
          (g) => g.value == transaction.amount.toString()
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
          0
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
          0
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
          1
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
          0
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
        const group = groups.find((g) => g.value == transaction.tag);
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transaction.tag,
            transactions: [transaction],
          });
        }
        break;
      }
    }
  });

  // TODO : Sort Groups & Format Groups Name
  for (const group of groups) {
    switch (groupBy) {
      case "amount":
        group.value = FormatMoney(parseInt(group.value)) + " €";
        break;
      case "date":
        group.value = FormatDate(parseInt(group.value));
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
            16
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
  accoutTransactions: Transaction[]
) {
  const datasets: ChartDataset[] = [];
  let labels: string[] = [];
  const backgroundColor: string[] = [];
  const borderColor: string[] = [];

  for (const metric of metrics) {
    let name = metric.field;
    name = name.charAt(0).toUpperCase() + name.slice(1);

    labels = [];
    const data: number[] = [];

    for (const group of groups) {
      let values;
      switch (metric.field) {
        case "amount": {
          values = group.transactions.map((t) => t.amount);
          break;
        }
        case "balance": {
          values = group.transactions.map((t) =>
            accoutTransactions
              .filter((at) => at.date <= t.date)
              .map((at) => at.amount)
              .reduce((p, a) => p + a, 0)
          );
          break;
        }
        case "count":
          values = [group.transactions.length];
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
          `${tailwindConfig.theme.colors["cta-primarly"]}${Math.round(
            0.8 * 255
          ).toString(16)}`
      );
      borderColor.push(
        group.borderColor || tailwindConfig.theme.colors["cta-primarly"]
      );
    }

    datasets.push({
      label: name,
      data,
      backgroundColor,
      borderColor,
    });
  }

  return { labels, datasets };
}

export function BuildData(config: ChartDataBuilderConfig, account: Account) {
  const filteredTransactions = filterTransactions(
    account.transactions,
    config.filters
  );
  const groups = groupTransactions(
    filteredTransactions,
    config.groupBy,
    account
  );

  return buildDatasets(groups, config.metrics, account.transactions);
}
