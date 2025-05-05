import {
  Account,
  ChartAvailableFields,
  ChartAvailableFieldsEnum,
  Transaction,
  TransactionsFilter,
} from "@finance-tracker/types";
import { ChartFilterOperators } from "../../../packages/types/dist/types/charts";

export const FilterItem = (
  filter: string,
  transaction: Transaction,
  account: Account,
) => {
  const filters = ParseFilter(filter);
  console.log(filters, transaction, account);
  return true;
};

function ParseFilter(filter: string) {
  let availableFields = Object.values(ChartAvailableFieldsEnum.enum);
  const operators = [":", "=", ">", "<"];

  const tokens = filter.split(" ");
  const filters: TransactionsFilter[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith("@")) {
      let field = null;
      let operator = null;
      let value = null;

      for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        if (token.includes(op)) {
          field = token.split(op)[0].slice(1);
          operator = op;
          value = token.split(op).slice(1).join(op);
          break;
        }
      }

      if (field && availableFields.includes(field as ChartAvailableFields)) {
        let inverted = field.endsWith("!");
        if (inverted) {
          field = field.slice(0, -1);
        }

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
  }

  return filters;
}
