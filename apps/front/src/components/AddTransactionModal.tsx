import {
  Account,
  FetchServerType,
  Transaction,
  TransactionTypes,
  TransactionTypeSchema,
} from "@finance-tracker/types";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useBearStore } from "../GlobalState";
import { FetchAccounts, FormatMoney, renderTransactions } from "../Utils";
import FTButton from "./FTButton";
import FTCheckbox from "./FTCheckbox";
import { FileInput } from "./FTFileInput";
import FTInput from "./FTInput";
import FTSelect from "./FTSelect";
import FTTabSelector from "./FTTabSelector";
import FTTextArea from "./FTTextArea";
import TransactionTagsSelect from "./TransactionTagsSelect";

const UploadFile = async (file: File, fetchServer: FetchServerType) => {
  try {
    const result = { id: "", name: file.name };
    const formData = new FormData();
    formData.append("file", file);
    const fetchedId = await fetchServer("/files/upload", {
      method: "POST",
      body: formData,
    });
    const id = z.string().parse(await fetchedId.text());
    result.id = id;

    return result;
  } catch {
    return null;
  }
};

const AddTransactionModal = ({
  saveTransaction,
  hideModal,
  transactionId,
  transaction,
  allowedTypes,
}: {
  hideModal: () => void;
  saveTransaction: (
    transaction: Omit<Transaction, "id">,
    accountId: string,
    fetchServer: FetchServerType,
    transactionId?: string,
  ) => Promise<string>;
  transactionId?: string;
  transaction?: Transaction;
  allowedTypes?: TransactionTypes[];
}) => {
  const { account, setAccount, refreshAccount, fetchServer } = useBearStore();

  const [step, setStep] = useState(0);

  const [type, setType] =
    useState<z.infer<typeof TransactionTypeSchema>>("classic");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [amount, setAmount] = useState(0);
  const [defered, setDefered] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>();

  // Internal
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [targetAccount, setTargetAccount] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Lend
  const [lendTarget, setLendTarget] = useState<string>("");
  const [reimbursementTransaction, setReimbursementTransaction] =
    useState<Transaction | null>(null);

  const adjustToLocalTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split(".")[0];
  };

  const closeModal = () => {
    hideModal();
    setType("classic");
    setName("");
    setDescription("");
    setDate("");
    setAmount(0);
    setDefered(false);
    setTags([]);
    setLendTarget("");
    setStep(0);
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  const getAllowedTypes = () => {
    if (allowedTypes && allowedTypes.length > 0) {
      return allowedTypes
        .map((type) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: type.toLowerCase(),
        }))
        .filter((option) => {
          // Filter out "internal" if there are no other accounts
          if (
            option.value === "internal" &&
            (!accounts || accounts.length === 0)
          ) {
            return false;
          }
          return true;
        });
    } else {
      return [
        { name: "Classic", value: "classic" },
        { name: "Lend", value: "lend" },
        ...(accounts && accounts.length > 0
          ? [{ name: "Internal", value: "internal" }]
          : []),
      ];
    }
  };

  useEffect(() => {
    if ((transactionId || transaction) && account) {
      const editedTransaction =
        transaction ||
        renderTransactions(account).find((t) => t.id === transactionId);
      if (editedTransaction) {
        setType(editedTransaction.type);
        setName(editedTransaction.name);
        setDescription(editedTransaction.description);
        setDate(adjustToLocalTime(editedTransaction.date));
        setTags(
          editedTransaction.tags
            .map((t) => account.tags.find((tag) => tag.id === t)?.id)
            .filter((id): id is string => typeof id === "string"),
        );
        setAmount(editedTransaction.amount);
        setDefered(editedTransaction.defered);

        if (editedTransaction.type === "internal") {
          setTargetAccount({
            id:
              editedTransaction.from.id === account.id
                ? editedTransaction.to.id
                : editedTransaction.from.id,
            name:
              editedTransaction.from.id === account.id
                ? editedTransaction.to.name
                : editedTransaction.from.name,
          });
        }

        if (editedTransaction.type === "lend") {
          setLendTarget(editedTransaction.target);
          setReimbursementTransaction(
            (editedTransaction.reimbursementTransaction as Transaction) || null,
          );
        }
      }
    }
  }, [transactionId, transaction, account]);

  // Fetch accounts on mount to determine if "Internal" option should be available
  useEffect(() => {
    if (!accounts) {
      FetchAccounts((fetchedAccounts) => {
        const validAccounts = fetchedAccounts.filter(
          (a) => a.id !== account?.id,
        );
        setAccounts(validAccounts);
      }, fetchServer);
    }
  }, [accounts, fetchServer, account]);

  useEffect(() => {
    if (type === "internal" && accounts) {
      if (accounts.length === 0) {
        setType("classic");
      } else {
        if (!targetAccount) {
          setTargetAccount({
            id: accounts[0].id,
            name: accounts[0].name,
          });
        }
      }
    }
  }, [type, accounts, targetAccount]);

  return (
    <div
      className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center">
        <p className="m-2 text-active-text-color text-xl">
          {transactionId || transaction ? "Edit" : "Add"} Transaction
        </p>
        {step === 0 && (
          <>
            {!(transactionId || transaction) && (
              <FTTabSelector
                options={getAllowedTypes()}
                value={type}
                onChange={(newType) => {
                  setType(newType as z.infer<typeof TransactionTypeSchema>);
                }}
              />
            )}
            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color w-24">Name : </p>
              <FTInput
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color w-24">Date : </p>
              <FTInput
                placeholder="Date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[218px]"
              />
            </div>

            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color w-24">Amount : </p>
              <FTInput
                placeholder="Amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  const nRegex = /^-?\d+(\.\d+)?$/;
                  if (nRegex.test(e.target.value))
                    setAmount(Number(e.target.value));
                }}
              />
            </div>

            {type != "lend" && (
              <div className="flex flex-row gap-3 items-center m-2">
                <p className="text-text-color w-24">Defered : </p>
                <FTCheckbox
                  checked={defered}
                  className="min-w-[218px]"
                  onChange={(e) => setDefered(e.target.checked)}
                />
              </div>
            )}

            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color w-24">Tag : </p>
              <TransactionTagsSelect
                value={tags}
                onChange={(tags) => setTags(tags)}
                className="min-w-[218px]"
              />
            </div>
            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color w-24">Description : </p>
              <FTTextArea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {!(transactionId || transaction) && (
              <FileInput
                className="m-2 w-3/4"
                ref={(element) => {
                  if (element) {
                    fileInput.current = element;
                  }
                }}
              />
            )}
          </>
        )}
        {step === 1 && type == "internal" && accounts && (
          <div className="flex flex-col items-center">
            <p className="text-text-color">
              {amount > 0
                ? `Transfer ${FormatMoney(amount)}€ from the following account to the current one`
                : `Transfer ${FormatMoney(-amount)}€ from this account to the following one`}
            </p>
            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color">
                {amount > 0 ? "Source" : "Target"} Account :{" "}
              </p>
              <FTSelect
                value={targetAccount?.id || ""}
                onChange={(e) => {
                  const newTargetAccount =
                    accounts.find((a) => a.id === e.target.value) || null;

                  if (newTargetAccount) {
                    setTargetAccount({
                      id: newTargetAccount.id,
                      name: newTargetAccount.name,
                    });
                  } else {
                    setTargetAccount(null);
                  }
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </FTSelect>
            </div>
          </div>
        )}
        {step === 1 && type == "lend" && accounts && (
          <div className="flex flex-col items-center">
            <p className="text-text-color">
              {amount > 0
                ? `The following person lend you ${FormatMoney(amount)}€`
                : `You lend ${FormatMoney(-amount)}€ to the following person`}
            </p>
            <div className="flex flex-row gap-3 items-center m-2">
              <p className="text-text-color">
                {amount > 0 ? "Lender" : "Borrower"} :
              </p>
              <FTInput
                placeholder="Name"
                value={lendTarget}
                onChange={(e) => setLendTarget(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="flex flex-row gap-2">
          {step > 0 && (
            <FTButton onClick={() => setStep(step - 1)} className="m-2">
              Back
            </FTButton>
          )}
          <FTButton
            className="m-2"
            onClick={async () => {
              if (!name || !date || !tags || !amount) return;

              if (
                type == "classic" ||
                (type == "internal" &&
                  step === 1 &&
                  targetAccount &&
                  accounts) ||
                (type == "lend" && step === 1 && lendTarget && accounts)
              ) {
                let fileObject = null;
                if (fileInput.current?.files) {
                  fileObject = await UploadFile(
                    fileInput.current.files[0],
                    fetchServer,
                  );
                }

                const transaction = {
                  type,
                  name,
                  created_at: Date.now(),
                  description,
                  date: new Date(date).getTime(),
                  tags,
                  defered,
                  amount,
                  periodic: null,
                  file: fileObject,
                } as Transaction;

                if (transaction.type === "internal") {
                  transaction.amount = Math.abs(amount);
                  if (amount > 0) {
                    transaction.from = targetAccount!;
                    transaction.to = { id: account!.id, name: account!.name };
                  } else {
                    transaction.to = targetAccount!;
                    transaction.from = { id: account!.id, name: account!.name };
                  }
                }

                if (transaction.type === "lend") {
                  transaction.target = lendTarget;
                  transaction.reimbursementTransaction =
                    reimbursementTransaction || null;
                }

                await saveTransaction(
                  transaction,
                  account!.id,
                  fetchServer,
                  transactionId || transaction?.id,
                );
                await refreshAccount(account!.id, setAccount);
                closeModal();
              } else if ((type == "internal" || type == "lend") && step == 0) {
                setStep(1);
              }
            }}
          >
            {type == "classic" ||
            ((type == "internal" || type == "lend") && step === 1)
              ? "Save Transaction"
              : "Next Step"}
          </FTButton>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
