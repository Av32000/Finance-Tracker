import {
  ChartAvailableFieldsEnum,
  ChartFilterOperatorsEnum,
  TransactionsFilter,
} from "@finance-tracker/types";
import { useState } from "react";
import FTButton from "./FTButton";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";

const TransactionsFiltersManager = ({
  filters,
  setFilters,
}: {
  filters: { id: number; filter: TransactionsFilter }[];
  setFilters: (filters: { id: number; filter: TransactionsFilter }[]) => void;
}) => {
  const [newFilterType, setNewFilterType] = useState<"property" | "sort">(
    "property",
  );

  const generateId = () => {
    const ids = filters.map((f) => f.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  const addFilter = () => {
    if (newFilterType === "property") {
      setFilters([
        ...filters,
        {
          id: generateId(),
          filter: {
            type: "property",
            field: "amount",
            operator: "equals",
            value: 0,
          },
        },
      ]);
    } else {
      setFilters([
        ...filters,
        {
          id: generateId(),
          filter: {
            type: "sort",
            field: "amount",
            order: "desc",
          },
        },
      ]);
    }
  };

  const updateFilter = (id: number, updatedFilter: TransactionsFilter) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { id, filter: updatedFilter } : filter,
      ),
    );
  };

  const deleteFilter = (id: number) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  return (
    <div className="max-h-[500px] overflow-y-scroll">
      {filters.length === 0 ? (
        <p className="text-active-text-color italic mb-4">
          No filters added yet
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {filters.map(({ id, filter }) => (
            <FilterItem
              key={id}
              id={id}
              filter={filter}
              updateFilter={(updatedFilter) => updateFilter(id, updatedFilter)}
              deleteFilter={() => deleteFilter(id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-row gap-4 items-center mb-4">
        <p>Filter Type :</p>
        <FTSelect
          value={newFilterType}
          onChange={(e) =>
            setNewFilterType(e.target.value as "property" | "sort")
          }
          className="ml-2 p-1 border rounded"
        >
          <option value="property" className="text-text-color bg-transparent">
            Property
          </option>
          <option value="sort" className="text-text-color bg-transparent">
            Sort
          </option>
        </FTSelect>
        <FTButton onClick={addFilter}>Add Filter</FTButton>
      </div>
    </div>
  );
};

const FilterItem: React.FC<{
  id: number;
  filter: TransactionsFilter;
  updateFilter: (filter: TransactionsFilter) => void;
  deleteFilter: () => void;
}> = ({ id, filter, updateFilter, deleteFilter }) => {
  const availableFields = Object.values(ChartAvailableFieldsEnum.enum);
  const availableOperators = Object.values(ChartFilterOperatorsEnum.enum);

  if (filter.type === "property") {
    return (
      <div className="p-4 my-4 border rounded-md bg-white shadow-sm">
        <div className="flex justify-between mb-2">
          <h3 className="font-medium">Property Filter #{id}</h3>
          <FTButton onClick={deleteFilter} className="bg-red">
            Delete
          </FTButton>
        </div>

        <div className="flex flex-row gap-4 items-center">
          <FTSelect
            value={filter.field}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateFilter({ ...filter, field: e.target.value as any })
            }
            className="text-start"
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
          <FTSelect
            value={filter.operator}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateFilter({ ...filter, operator: e.target.value as any })
            }
            className="text-start"
          >
            {availableOperators.map((operator) => (
              <option
                key={operator}
                value={operator}
                className="text-text-color bg-transparent"
              >
                {operator.charAt(0).toUpperCase() +
                  operator.replace(/_/g, " ").slice(1)}
              </option>
            ))}
          </FTSelect>

          {filter.operator === "between" ? (
            <div className="flex gap-4">
              <FTInput
                type={
                  ["amount", "year", "month", "day", "hour"].includes(
                    filter.field,
                  )
                    ? "number"
                    : "text"
                }
                value={Array.isArray(filter.value) ? filter.value[0] : ""}
                onChange={(e) =>
                  updateFilter({
                    ...filter,
                    value: [
                      e.target.value,
                      Array.isArray(filter.value) ? filter.value[1] : "",
                    ],
                  })
                }
                placeholder="Min"
              />
              <FTInput
                type={
                  ["amount", "year", "month", "day", "hour"].includes(
                    filter.field,
                  )
                    ? "number"
                    : "text"
                }
                value={Array.isArray(filter.value) ? filter.value[1] : ""}
                onChange={(e) =>
                  updateFilter({
                    ...filter,
                    value: [
                      Array.isArray(filter.value) ? filter.value[0] : "",
                      e.target.value,
                    ],
                  })
                }
                placeholder="Max"
              />
            </div>
          ) : (
            <FTInput
              type={
                ["amount", "year", "month", "day", "hour"].includes(
                  filter.field,
                )
                  ? "number"
                  : "text"
              }
              value={filter.value}
              onChange={(e) =>
                updateFilter({ ...filter, value: e.target.value })
              }
            />
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="p-4 my-4 border rounded-md bg-white shadow-sm">
        <div className="flex justify-between mb-2">
          <h3 className="font-medium">Sort Filter #{id}</h3>
          <FTButton onClick={deleteFilter} className="bg-red">
            Delete
          </FTButton>
        </div>

        <div className="flex flex-row gap-4 mb-4">
          <FTSelect
            value={filter.field}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateFilter({ ...filter, field: e.target.value as any })
            }
            className="text-start"
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

          <FTSelect
            value={filter.order}
            onChange={(e) =>
              updateFilter({
                ...filter,
                order: e.target.value as "asc" | "desc",
              })
            }
            className="text-start"
          >
            <option value="asc" className="text-text-color bg-transparent">
              Ascending
            </option>
            <option value="desc" className="text-text-color bg-transparent">
              Descending
            </option>
          </FTSelect>
        </div>

        <div className="flex flex-row gap-4 items-center">
          <p className="text-active-text-color">Limit (Optional) :</p>
          <FTInput
            type="number"
            value={filter.limit || ""}
            onChange={(e) => {
              const value = e.target.value
                ? parseInt(e.target.value)
                : undefined;
              updateFilter({ ...filter, limit: value });
            }}
            placeholder="Optional"
          />
        </div>
      </div>
    );
  }
};

export default TransactionsFiltersManager;
