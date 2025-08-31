const FTTabSelector = ({
  options,
  value,
  onChange,
}: {
  options: { name: string; value: string }[];
  value: string;
  onChange: (newValue: string) => void;
}) => {
  return (
    <div className="flex bg-bg-dark rounded p-1 text-sm gap-2">
      {options.map((option) => (
        <p
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded py-1 px-1 ${
            value === option.value
              ? "bg-bg-light text-active-text-color"
              : "text-text-color"
          }`}
        >
          {option.name}
        </p>
      ))}
    </div>
  );
};

export default FTTabSelector;
