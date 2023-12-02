import { Transaction } from "./account"

type FilterKeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
  }[keyof T];

type Filter = {
    propsName: FilterKeysOfType<Transaction, string>,
    type: "string",
    operation: FilterStringOperation,
    value: string
} | {
    propsName: FilterKeysOfType<Transaction, number>,
    type: "number",
    operation: FilterNumberOperation,
    value: number
}

type FilterStringOperation = "=" | "!="
type FilterNumberOperation = "<" | "<=" | "=" | "!=" | ">=" | ">"
type ChartType = "EvolutionChart" | "DistributionPieChart"

export type {Filter, ChartType}