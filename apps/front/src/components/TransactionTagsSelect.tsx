import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import TransactionTagElement from "./TransactionTagElement";

interface TransactionTagsSelectProps {
  value?: string[];
  onChange?: (selectedTags: string[]) => void;
  className?: string;
  disabled?: boolean;
}

const TransactionTagsSelect = ({
  value = [],
  onChange,
  className,
}: TransactionTagsSelectProps) => {
  const { account } = useBearStore();
  const [selectedTags, setSelectedTags] = useState<string[]>(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedTags(value);
  }, [value]);

  const handleTagToggle = (tagId: string) => {
    let updatedTags: string[];
    if (selectedTags.includes(tagId)) {
      updatedTags = selectedTags.filter((id) => id !== tagId);
    } else {
      updatedTags = [...selectedTags, tagId];
    }

    setSelectedTags(updatedTags);
    onChange?.(updatedTags);
  };

  const getDisplayText = () => {
    if (selectedTags.length === 0) return "No Tags Selected";
    return selectedTags.map((t) => (
      <TransactionTagElement tagId={t} accountTags={account!.tags} key={t} />
    ));
  };

  return account ? (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-bg-light border-text-color border rounded text-active-text-color outline-none px-3 py-1 text-center cursor-pointer flex flex-col gap-1`}
      >
        {getDisplayText()}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-bg-light border border-text-color rounded mt-1 max-h-60 overflow-y-auto z-50">
          {account.tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center px-3 py-2 hover:bg-opacity-80 cursor-pointer"
              onClick={() => handleTagToggle(tag.id)}
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => {}}
                className="mr-2"
              />
              <TransactionTagElement
                tagId={tag.id}
                accountTags={account.tags}
                key={tag.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;
};

export default TransactionTagsSelect;
