import {
  Account,
  AccountsSchema,
  FetchServerType,
  Transaction,
} from "@finance-tracker/types";

const FormatDate = (date: number) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FormatDateWithoutHours = (date: number) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const FormatDateHour = (date: number) => {
  return new Date(date).toLocaleDateString(undefined, {
    hour: "2-digit",
  });
};

const FormatDateMonth = (date: number) => {
  return new Date(date).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

const FormatMoney = (value: number): string => {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
};

const FetchAccounts = async (
  setAccounts: (accounts: Account[]) => void,
  fetchServer: FetchServerType,
) => {
  try {
    const fetchedAccouts = await fetchServer("/accounts");
    const accounts = AccountsSchema.parse(await fetchedAccouts.json());
    setAccounts(accounts);
  } catch (e) {
    console.error(e);
  }
};

const renderTransactions = (account: Account): Transaction[] => {
  const renderedTransactions: Transaction[] = [];

  for (const transaction of account.transactions) {
    if (transaction.type === "internal") {
      renderedTransactions.push({
        ...transaction,
        amount:
          transaction.from.id === account.id
            ? -transaction.amount
            : transaction.amount,
      });
    } else {
      renderedTransactions.push(transaction);
    }
  }

  return renderedTransactions;
};

export {
  FetchAccounts,
  FormatDate,
  FormatDateHour,
  FormatDateMonth,
  FormatDateWithoutHours,
  FormatMoney,
  renderTransactions,
};
