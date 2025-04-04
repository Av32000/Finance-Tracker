import {
  ChartAvailableFields,
  ChartAvailableFieldsEnum,
  ChartMetric,
  ChartType,
  ChartTypeEnum,
  FTChart as FTChartType,
  TransactionsFilter,
} from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import ChartsMetricsManager from "./ChartsMetricsManager";
import FTButton from "./FTButton";
import FTChart from "./FTChart";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";
import TransactionsFiltersManager from "./TransactionsFiltersManager";

const FTCreateChartModal = ({
  hideModal,
  chartId,
}: {
  hideModal: () => void;
  chartId?: string;
}) => {
  const { account, setAccount, refreshAccount, fetchServer } = useBearStore();

  const chartTypes = Object.values(ChartTypeEnum.enum);
  const chartFields = Object.values(ChartAvailableFieldsEnum.enum);

  const [step, setStep] = useState(1);

  const [chartName, setChartName] = useState("");
  const [chartType, setChartType] = useState<ChartType>("Pie");
  const [groupBy, setGroupBy] = useState<ChartAvailableFields>("amount");
  const [filters, setFilters] = useState<
    { id: number; filter: TransactionsFilter }[]
  >([]);
  const [metrics, setMetrics] = useState<{ id: number; metric: ChartMetric }[]>(
    [],
  );
  const stepCount = 4;

  useEffect(() => {
    if (account && account.charts.find((c) => c.id === chartId)) {
      const chart = account.charts.find((c) => c.id === chartId) as FTChartType;
      setChartName(chart.name);
      setChartType(chart.type);
      setGroupBy(chart.dataBuilderConfig.groupBy);
      setFilters(
        chart.dataBuilderConfig.filters.map((filter, id) => ({ id, filter })),
      );
      setMetrics(
        chart.dataBuilderConfig.metrics.map((metric, id) => ({ id, metric })),
      );
    }
  }, [account, chartId]);

  const next = async () => {
    switch (step) {
      case 1:
        if (chartName) setStep(step + 1);
        break;
      case 2:
        setStep(step + 1);
        break;
      case 3:
        if (metrics.length > 0) setStep(step + 1);
        break;
      case 4:
        await fetchServer(
          `/accounts/${account?.id}/charts${chartId ? `/${chartId}` : ""}`,
          {
            method: chartId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: "",
              name: chartName,
              type: chartType,
              dataBuilderConfig: {
                filters: filters.map((f) => f.filter),
                metrics: metrics.map((m) => m.metric),
                groupBy,
              },
            }),
          },
        );
        await refreshAccount(account!.id, setAccount);
        hideModal();
    }
  };

  return (
    <div
      className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideModal();
        }
      }}
    >
      <div className="p-10 w-2/3 bg-bg-light rounded-xl flex flex-col justify-center mobile:w-5/6">
        <p className="text-xl text-active-text-color mobile:text-center">
          Creating a new chart ({step}/{stepCount})
        </p>
        {step == 1 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 mt-4 mobile:gap-2">
            <div className="flex flex-row gap-4 items-center mobile:flex-col mobile:items-start mobile:gap-2">
              <p className="text-active-text-color min-w-fit">
                Chart Name<span className="mobile:hidden"> :</span>
              </p>
              <FTInput
                placeholder="Chart Name"
                className="w-2/3 mobile:w-full"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == "Enter") next();
                }}
              />
              <p className="text-active-text-color min-w-fit desktop:hidden">
                Chart Type
              </p>
              <FTSelect
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="text-start mobile:w-full"
              >
                {chartTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                    className="text-text-color bg-transparent"
                  >
                    {type}
                  </option>
                ))}
              </FTSelect>
            </div>
            <div className="flex flex-row gap-4 items-center mobile:flex-col mobile:items-start mobile:gap-2">
              <p className="text-active-text-color">
                Group Transactions By<span className="mobile:hidden"> :</span>
              </p>
              <FTSelect
                value={groupBy}
                onChange={(e) =>
                  setGroupBy(e.target.value as ChartAvailableFields)
                }
                className="text-start mobile:w-full"
              >
                {chartFields.map((field) => (
                  <option
                    key={field}
                    value={field}
                    className="text-text-color bg-transparent"
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
              </FTSelect>
            </div>
          </div>
        )}
        {step == 2 && (
          <div className="flex flex-col gap-3 justify-center-center my-2">
            <p className="text-active-text-color">
              Select your transactions by adding filters :
              <TransactionsFiltersManager
                filters={filters}
                setFilters={setFilters}
              />
            </p>
          </div>
        )}
        {step == 3 && (
          <div className="flex flex-col gap-3 justify-center-center my-2">
            <p className="text-active-text-color">
              Extract data from the transactions by adding metrics :
              <ChartsMetricsManager metrics={metrics} setMetrics={setMetrics} />
            </p>
          </div>
        )}
        {step == 4 && (
          <div className="flex flex-col gap-3 justify-center-center my-2">
            <p className="text-active-text-color">Preview your chart :</p>
            <div className="max-h-full mobile:h-60">
              <FTChart
                chart={{
                  id: "",
                  name: chartName,
                  type: chartType,
                  dataBuilderConfig: {
                    filters: filters.map((f) => f.filter),
                    metrics: metrics.map((m) => m.metric),
                    groupBy,
                  },
                }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-row w-full gap-4 mobile:gap-2">
          {step > 1 && (
            <FTButton className="w-full" onClick={() => setStep(step - 1)}>
              Previous
            </FTButton>
          )}
          <FTButton className="w-full" onClick={next}>
            {step < stepCount ? "Next" : "Save"}
          </FTButton>
        </div>
      </div>
    </div>
  );
};

export default FTCreateChartModal;
