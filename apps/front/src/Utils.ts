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

export {
  FormatDate,
  FormatDateHour,
  FormatDateMonth,
  FormatDateWithoutHours,
  FormatMoney,
};
