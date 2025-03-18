import {
  ChartMetric,
  ChartMetricsFieldsEnum,
  ChartMetricsFunctionsEnum,
  TransactionsFilter,
} from "@finance-tracker/types";
import { useState } from "react";
import tailwindConfig from "../../tailwind.config";
import FTButton from "./FTButton";
import FTCheckbox from "./FTCheckbox";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";
import TransactionsFiltersManager from "./TransactionsFiltersManager";

const ChartsMetricsManager = ({
  metrics,
  setMetrics,
}: {
  metrics: { id: number; metric: ChartMetric }[];
  setMetrics: (metrics: { id: number; metric: ChartMetric }[]) => void;
}) => {
  const generateId = () => {
    const ids = metrics.map((f) => f.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  const addMetric = () => {
    setMetrics([
      ...metrics,
      {
        id: generateId(),
        metric: {
          name: "",
          color: tailwindConfig.theme.colors["cta-primarly"],
          filters: [],
          field: "amount",
          function: "void",
          cumulative: false,
        },
      },
    ]);
  };

  const updateMetric = (id: number, updatedMetric: ChartMetric) => {
    setMetrics(
      metrics.map((metric) =>
        metric.id === id ? { id, metric: updatedMetric } : metric,
      ),
    );
  };

  const deleteMetric = (id: number) => {
    setMetrics(metrics.filter((metric) => metric.id !== id));
  };

  return (
    <div className="max-h-[500px] mobile:max-h-[300px] overflow-y-scroll">
      {metrics.length === 0 ? (
        <p className="text-active-text-color italic mb-4">
          No metrics added yet
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {metrics.map(({ id, metric }) => (
            <MetricItem
              key={id}
              id={id}
              metric={metric}
              updateMetric={(updatedMetric) => updateMetric(id, updatedMetric)}
              deleteMetric={() => deleteMetric(id)}
            />
          ))}
        </div>
      )}

      <FTButton onClick={addMetric} className="mobile:w-full">
        Add Metric
      </FTButton>
    </div>
  );
};

const MetricItem: React.FC<{
  id: number;
  metric: ChartMetric;
  updateMetric: (metric: ChartMetric) => void;
  deleteMetric: () => void;
}> = ({ id, metric, updateMetric, deleteMetric }) => {
  const [filters, setFilters] = useState<
    { id: number; filter: TransactionsFilter }[]
  >(metric.filters.map((filter, id) => ({ id, filter })));

  const availableFields = Object.values(ChartMetricsFieldsEnum.enum);
  const availableFunctions = Object.values(ChartMetricsFunctionsEnum.enum);

  return (
    <div className="p-4 my-4 border rounded-md bg-white shadow-sm">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium">Metric #{id}</h3>
        <FTButton onClick={deleteMetric} className="bg-red">
          Delete
        </FTButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex flex-row gap-4 items-center mobile:flex-col mobile:items-start mobile:gap-2">
          <p className="text-active-text-color">
            Display<span className="mobile:hidden"> :</span>
          </p>
          <FTInput
            type="text"
            value={metric.name}
            onChange={(e) =>
              updateMetric({
                ...metric,
                name: e.target.value,
              })
            }
            placeholder="Name"
          />
          <FTInput
            type="color"
            value={metric.color}
            className="mobile:w-full"
            onChange={(e) =>
              updateMetric({
                ...metric,
                color: e.target.value,
              })
            }
          />
        </div>
        <div className="flex flex-row gap-4 items-center mobile:flex-col mobile:items-start mobile:gap-2">
          <p className="text-active-text-color">
            Field<span className="mobile:hidden"> :</span>
          </p>
          <FTSelect
            value={metric.field}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateMetric({ ...metric, field: e.target.value as any })
            }
            className="text-start mobile:w-full"
          >
            {availableFields.map((field) => (
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
        <div className="flex flex-row gap-4 items-center mobile:flex-col mobile:items-start mobile:gap-2">
          <p className="text-active-text-color">
            Function<span className="mobile:hidden"> :</span>
          </p>
          <FTSelect
            value={metric.function}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateMetric({ ...metric, function: e.target.value as any })
            }
            className="text-start mobile:w-full"
          >
            {availableFunctions.map((f) => (
              <option
                key={f}
                value={f}
                className="text-text-color bg-transparent"
              >
                {f != "void"
                  ? f.charAt(0).toUpperCase() + f.slice(1)
                  : "No Function"}
              </option>
            ))}
          </FTSelect>
          <div className="flex flex-row gap-4 mobile:gap-2">
            <p className="text-active-text-color">Cumulative :</p>
            <FTCheckbox
              checked={metric.cumulative}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                updateMetric({ ...metric, cumulative: e.target.checked })
              }
            />
          </div>
        </div>
        <div className="border rounded-md bg-white shadow-sm p-4">
          <p>Specific Transactions Filters : </p>
          <TransactionsFiltersManager
            filters={filters}
            setFilters={(filters) => {
              setFilters(filters);
              updateMetric({
                ...metric,
                filters: filters.map((f) => f.filter),
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartsMetricsManager;
