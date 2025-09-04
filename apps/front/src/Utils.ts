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

  const addTransaction = (t: Transaction) => {
    if (t.type === "internal") {
      renderedTransactions.push({
        ...t,
        amount: t.from.id === account.id ? -t.amount : t.amount,
      });
    } else {
      renderedTransactions.push(t);
    }
  };

  for (const transaction of account.transactions) {
    if (transaction.periodic != null) {
      const now = new Date();
      let currentOccurence = 0;
      const currentDate = new Date(transaction.date);
      const periodicRule = transaction.periodic;

      const advanceDate = () => {
        if (periodicRule.rule.freq === "daily") {
          currentDate.setDate(
            currentDate.getDate() + periodicRule.rule.interval,
          );
        } else if (periodicRule.rule.freq === "weekly") {
          currentDate.setDate(
            currentDate.getDate() + 7 * periodicRule.rule.interval,
          );
        } else if (periodicRule.rule.freq === "monthly") {
          currentDate.setMonth(
            currentDate.getMonth() + periodicRule.rule.interval,
          );
        } else if (periodicRule.rule.freq === "yearly") {
          currentDate.setFullYear(
            currentDate.getFullYear() + periodicRule.rule.interval,
          );
        }
      };

      const processOccurrence = () => {
        if (currentDate > now) return false;

        const mod = periodicRule.modified.find(
          (m) => m.occurence === currentOccurence,
        );
        if (mod && mod.value != null) {
          const modifiedTransaction = account.transactions.find(
            (tr) => tr.id === mod.value,
          );
          if (modifiedTransaction) addTransaction(modifiedTransaction);
        } else {
          addTransaction(transaction);
        }

        currentOccurence++;
        advanceDate();
        return true;
      };

      if (periodicRule.rule.endRule.type === "afterOccurrences") {
        while (currentOccurence < periodicRule.rule.endRule.value) {
          if (!processOccurrence()) break;
        }
      } else {
        const targetDate =
          periodicRule.rule.endRule.type === "afterDate"
            ? new Date(periodicRule.rule.endRule.value)
            : now;

        while (currentDate <= targetDate) {
          if (!processOccurrence()) break;
        }
      }
    } else {
      addTransaction(transaction);
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
