import { FetchServerType } from "@finance-tracker/types";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useBearStore } from "../GlobalState";
import FTButton from "./FTButton";
import { FileInput } from "./FTFileInput";
import FTInput from "./FTInput";
import FTTextArea from "./FTTextArea";
import TransactionTagSelect from "./TransactionTagSelect";

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
    console.log(result);

    return result;
  } catch {
    return null;
  }
};

const SaveTransaction = async (
  accountId: string,
  name: string,
  description: string,
  date: number,
  tag: string,
  amount: number,
  file: {
    id: string;
    name: string;
  } | null,
  fetchServer: FetchServerType,
  transactionId?: string,
) => {
  if (transactionId) {
    console.log(date);

    await fetchServer(
      "/accounts/" + accountId + "/transactions/" + transactionId,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, date, tag, amount }),
      },
    );
  } else {
    await fetchServer("/accounts/" + accountId + "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, date, tag, amount, file }),
    });
  }
};

const AddTransactionModal = ({
  isOpen,
  setIsOpen,
  transactionId,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transactionId?: string;
}) => {
  const { account, setAccount, refreshAccount, fetchServer } = useBearStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tag, setTag] = useState("no_tag");
  const [amount, setAmount] = useState(0);
  const fileInput = useRef<HTMLInputElement | null>();

  const adjustToLocalTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split(".")[0];
  };

  useEffect(() => {
    if (transactionId && account) {
      let transaction = account.transactions.find(
        (t) => t.id === transactionId,
      );
      if (transaction) {
        console.log(transaction);

        setName(transaction.name);
        setDescription(transaction.description);
        setDate(adjustToLocalTime(transaction.date));
        setTag(
          account.tags.find((t) => t.id === transaction?.tag)?.id || "no_tag",
        );
        setAmount(transaction.amount);
      }
    }
  }, [transactionId, account, isOpen]);

  return (
    <div
      className={`${
        isOpen ? "flex" : "hidden"
      } absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
          setName("");
          setDate("");
          setAmount(0);
          setTag(account!.tags[0].id);
          if (fileInput.current) {
            fileInput.current.value = "";
          }
        }
      }}
    >
      <div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center">
        <p className="m-2 text-active-text-color text-xl">
          {transactionId ? "Edit" : "Add"} Transaction
        </p>
        <FTInput
          placeholder="Name"
          className="m-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FTInput
          placeholder="Date"
          className="m-2"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <FTInput
          placeholder="Amount"
          className="m-2"
          type="number"
          value={amount}
          onChange={(e) => {
            const nRegex = /^-?\d+(\.\d+)?$/;
            if (nRegex.test(e.target.value)) setAmount(Number(e.target.value));
          }}
        />
        <div className="flex flex-row gap-3 items-center">
          <p className="text-text-color">Tag : </p>
          <TransactionTagSelect
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </div>
        <FTTextArea
          placeholder="Description"
          className="m-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {!transactionId && (
          <FileInput
            className="m-2"
            ref={(element) => {
              if (element) {
                fileInput.current = element;
              }
            }}
          />
        )}
        <FTButton
          className="m-2"
          onClick={async () => {
            if (!name || !date || !tag || !amount) return;
            let fileObject = null;
            if (fileInput.current && fileInput.current.files) {
              fileObject = await UploadFile(
                fileInput.current.files[0],
                fetchServer,
              );
            }
            await SaveTransaction(
              account!.id,
              name,
              description,
              new Date(date).getTime(),
              tag,
              amount,
              fileObject,
              fetchServer,
              transactionId,
            );
            await refreshAccount(account!.id, setAccount);
            setIsOpen(false);
            setName("");
            setDescription("");
            setDate("");
            setAmount(0);
            setTag("no_tag");
            if (fileInput.current) {
              fileInput.current.value = "";
            }
          }}
        >
          Save Transaction
        </FTButton>
      </div>
    </div>
  );
};

export default AddTransactionModal;
