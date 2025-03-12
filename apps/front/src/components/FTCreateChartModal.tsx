import { TransactionsFilter } from "@finance-tracker/types";
import { useState } from "react";
import FTButton from "./FTButton";
import FTInput from "./FTInput";
import TransactionsFiltersManager from "./TransactionsFiltersManager";

const FTCreateChartModal = ({ hideModal }: { hideModal: () => void }) => {
  const [step, setStep] = useState(1);

  const [chartName, setChartName] = useState("");
  const [filters, setFilters] = useState<
    { id: number; filter: TransactionsFilter }[]
  >([]);
  const stepCount = 5;

  const next = () => {
    switch (step) {
      case 1:
        if (chartName) setStep(step + 1);
        break;

      default:
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
          <div className="flex flex-row gap-3 items-center my-2">
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
