import {
  ChartAvailableFields,
  ChartDataBuilderConfig,
  Transaction,
  TransactionsFilter,
} from "@finance-tracker/types";

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
  groupBy: ChartAvailableFields
) {
  const groups: { value: string; transactions: Transaction[] }[] = [];
  transactions.forEach((transaction) => {
    switch (groupBy) {
      case "name": {
        if (groups.length == 0) {
          groups.push({ value: "Transactions", transactions: [] });
        }
        groups[0].transactions.push(transaction);
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
      case "date": {
        const group = groups.find(
          (g) => g.value == transaction.date.toString()
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transaction.date.toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "hour": {
        const transactionDate = new Date(transaction.date);
        const group = groups.find(
          (g) => g.value == transactionDate.getHours().toString()
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transactionDate.getHours().toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "day": {
        const transactionDate = new Date(transaction.date);
        const group = groups.find(
          (g) => g.value == transactionDate.getDate().toString()
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transactionDate.getDate().toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "month": {
        const transactionDate = new Date(transaction.date);
        const group = groups.find(
          (g) => g.value == transactionDate.getMonth().toString()
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transactionDate.getMonth().toString(),
            transactions: [transaction],
          });
        }
        break;
      }
      case "year": {
        const transactionDate = new Date(transaction.date);
        const group = groups.find(
          (g) => g.value == transactionDate.getFullYear().toString()
        );
        if (group) {
          group.transactions.push(transaction);
        } else {
          groups.push({
            value: transactionDate.getFullYear().toString(),
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

  return groups;
}

export function BuildData(
  config: ChartDataBuilderConfig,
  transactions: Transaction[]
) {
  const filteredTransactions = filterTransactions(transactions, config.filters);

  // Extract and Parse Metrics
  const groups = groupTransactions(filteredTransactions, config.groupBy);
  console.log(groups);

  // Generate final data object
}
