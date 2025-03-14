import {
  ChartAvailableFields,
  ChartAvailableFieldsEnum,
  ChartMetric,
  ChartType,
  ChartTypeEnum,
  TransactionsFilter,
} from "@finance-tracker/types";
import { useState } from "react";
import ChartsMetricsManager from "./ChartsMetricsManager";
import FTButton from "./FTButton";
import FTChart from "./FTChart";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";
import TransactionsFiltersManager from "./TransactionsFiltersManager";

const FTCreateChartModal = ({ hideModal }: { hideModal: () => void }) => {
  const chartTypes = Object.values(ChartTypeEnum.enum);
  const chartFields = Object.values(ChartAvailableFieldsEnum.enum);

  const [step, setStep] = useState(1);

  const [chartName, setChartName] = useState("");
  const [chartType, setChartType] = useState<ChartType>("Line");
  const [groupBy, setGroupBy] = useState<ChartAvailableFields>("amount");
  const [filters, setFilters] = useState<
    { id: number; filter: TransactionsFilter }[]
  >([]);
  const [metrics, setMetrics] = useState<{ id: number; metric: ChartMetric }[]>(
    [],
  );
  const stepCount = 4;

  const next = () => {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 mt-4">
            <div className="flex flex-row gap-4 items-center">
              <p className="text-active-text-color">Chart Name : </p>
              <FTInput
                placeholder="Chart Name"
                className="w-2/3"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == "Enter") next();
                }}
              />
              <FTSelect
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="text-start"
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
            <div className="flex flex-row gap-4 items-center">
              <p className="text-active-text-color">Group Transactions By :</p>
              <FTSelect
                value={groupBy}
                onChange={(e) =>
                  setGroupBy(e.target.value as ChartAvailableFields)
                }
                className="text-start"
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
            <div className="max-h-full">
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
        <div className="flex flex-row w-full gap-4">
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
