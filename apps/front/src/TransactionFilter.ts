import {
  Account,
  ChartAvailableFields,
  ChartAvailableFieldsEnum,
  ChartFilterOperators,
  Transaction,
  TransactionsFilter,
} from "@finance-tracker/types";

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionsFilter[],
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
            propsValue = transaction.tags;
            if (propsValue.length === 0) propsValue = ["no_tag"];
            break;
        }

        if (filter.field == "tag" && Array.isArray(propsValue)) {
          switch (filter.operator) {
            case "equals":
              if (propsValue.includes(filter.value))
                newResult.push(transaction);
              break;
            case "not_equals":
              if (!propsValue.includes(filter.value))
                newResult.push(transaction);
              break;
            case "contains":
              if (propsValue.toString().includes(filter.value))
                newResult.push(transaction);
              break;
          }
        } else {
          switch (filter.operator) {
            case "equals":
              if (propsValue === filter.value) newResult.push(transaction);
              break;
            case "not_equals":
              if (propsValue !== filter.value) newResult.push(transaction);
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
              if (propsValue.toString().includes(filter.value))
                newResult.push(transaction);
              break;
          }
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

export function parseFilter(
  filter: string,
  account: Account,
): TransactionsFilter[] {
  const availableFields = Object.values(ChartAvailableFieldsEnum.enum);
  const operators = [":", "=", ">", "<"];

  // Parse tokens while respecting quoted strings
  const tokens: string[] = [];
  let currentToken = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < filter.length; i++) {
    const char = filter[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = "";
    } else if (char === " " && !inQuotes) {
      if (currentToken.trim()) {
        tokens.push(currentToken.trim());
        currentToken = "";
      }
      continue;
    } else {
      currentToken += char;
    }
  }

  if (currentToken.trim()) {
    tokens.push(currentToken.trim());
  }

  const filters: TransactionsFilter[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith("@")) {
      let field = null;
      let operator = null;
      let value: string | number | null = null;

      for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        if (token.includes(op) && token.split(op).length > 1) {
          field = token.split(op)[0].slice(1);
          operator = op;
          value = token.split(op).slice(1).join(op);

          // Remove quotes from value if present
          if (value && typeof value === "string") {
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }
          }

          break;
        }
      }

      if (field) {
        const inverted = field.endsWith("!");
        if (inverted) {
          field = field.slice(0, -1);
        }

        if (availableFields.includes(field as ChartAvailableFields)) {
          switch (operator) {
            case ":":
              operator = "contains";
              break;
            case "=":
              operator = inverted ? "not_equals" : "equals";
              break;
            case ">":
              operator = inverted ? "less_than" : "greater_than";
              break;
            case "<":
              operator = inverted ? "greater_than" : "less_than";
              break;
          }

          if (field === "tag") {
            const tag = account.tags.find(
              (tag) =>
                tag.name.toLowerCase() === value?.toString().toLowerCase(),
            );
            if (tag) {
              value = tag.id;
            } else {
              value = "no_tag";
            }
          }

          if (field === "month") {
            if (typeof value === "string") {
              if (!isNaN(Number(value))) {
                // Handle numeric month (1-12) -> convert to 0-based index
                value = (Number(value) - 1).toString();
              } else {
                const tempDate = new Date(`${value} 1, 2000`);
                if (!isNaN(tempDate.getTime())) {
                  value = tempDate.getMonth().toString();
                } else {
                  const currentYear = new Date().getFullYear();
                  const tempDate2 = new Date(`1 ${value} ${currentYear}`);
                  if (!isNaN(tempDate2.getTime())) {
                    value = tempDate2.getMonth().toString();
                  } else {
                    value = null;
                  }
                }
              }
            }
          }

          if (value && !isNaN(Number(value)) && value.trim() !== "") {
            value = Number(value);
          }

          filters.push({
            type: "property",
            field: field as ChartAvailableFields,
            operator: operator as ChartFilterOperators,
            value: value,
          });
        } else {
          filters.push({
            type: "property",
            field: "name",
            operator: "contains",
            value: token,
          });
        }
      } else {
        filters.push({
          type: "property",
          field: "name",
          operator: "contains",
          value: token,
        });
      }
    } else {
      filters.push({
        type: "property",
        field: "name",
        operator: "contains",
        value: token,
      });
    }
  }

  return filters;
}
