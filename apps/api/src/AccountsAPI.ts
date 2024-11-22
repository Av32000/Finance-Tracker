import {
  Account,
  ChartType,
  Filter,
  Setting,
  Transaction,
} from "@finance-tracker/types";
import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import JSZip from "jszip";
import path from "path";

const newAccountSchema = {
  id: 0,
  name: "",
  balance: 0,
  transactions: [],
  settings: [],
  monthly: 1000,
  currentMonthly: 0,
  tags: [],
  charts: [],
};

const prisma = new PrismaClient();

export default class AccountsAPI {
  accounts: Account[] = [];
  dataPath: string;
  filesPath: string;
  offline: boolean;
  accountsPath: string;

  constructor(dataPath: string, filesPath: string, offline: boolean) {
    this.dataPath = dataPath;
    this.filesPath = filesPath;
    this.offline = offline;
    this.accountsPath = path.join(dataPath, "accounts.json");

    this.SetupFiles();
    if (offline) this.LoadAccounts();
    else this.LoadDatabase();
  }

  LoadAccounts() {
    this.accounts = JSON.parse(readFileSync(this.accountsPath).toString());
    this.CleanFiles();
  }

  // Fix Accounts when account newAccountSchema was changed
  FixAccounts() {
    let fixCount = 0;
    this.accounts.forEach((element) => {
      let fix = false;

      this.UpdateBalance(element.id);

      // Add new keys
      Object.keys(newAccountSchema).forEach((key) => {
        if ((element as any)[key] === undefined) {
          (element as any)[key] = (newAccountSchema as any)[key];
          fix = true;
        }
      });

      // Remove deprecated keys
      Object.keys(element).forEach((key) => {
        if ((newAccountSchema as any)[key] === undefined) {
          delete (element as any)[key];
          fix = true;
        }
      });

      if (fix) fixCount++;
    });

    if (fixCount > 0) {
      this.SaveAccounts();
      console.log(
        fixCount + " propert" + (fixCount > 1 ? "ies" : "y") + " fixed",
      );
    }
  }

  // Accounts
  GetAccounts() {
    return this.accounts;
  }

  GetAccount(id: string) {
    return this.accounts.find((a) => a.id === id);
  }

  async ExportAccount(id: string) {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) return;

    const zip = new JSZip();
    zip.file("account.json", JSON.stringify(account));

    const fileFolder = zip.folder("files");
    if (!fileFolder) return;
    Array.prototype;
    account.transactions.forEach((t) => {
      if (
        t.file &&
        existsSync(
          path.join(
            this.dataPath,
            "files",
            t.file.id + "." + t.file.name.split(".").pop(),
          ),
        )
      ) {
        fileFolder.file(
          t.file.id + "." + t.file.name.split(".").pop(),
          readFileSync(
            path.join(
              this.dataPath,
              "files",
              t.file.id + "." + t.file.name.split(".").pop(),
            ),
          ),
        );
      }
    });

    return zip.generateAsync({ type: "nodebuffer" });
  }

  async ImportAccount(file: Buffer, force: boolean) {
    const zip = new JSZip();

    try {
      const zipData = await zip.loadAsync(file);
      let accountFile = zipData.file("account.json");
      let exist = false;
      if (accountFile) {
        try {
          const content: Account = JSON.parse(
            await accountFile.async("string"),
          );
          if (
            content.id == null ||
            content.name == null ||
            content.transactions == null
          )
            return 1;
          if (this.accounts.find((a) => a.id === content.id)) {
            if (force) {
              const account = this.accounts.find(
                (a) => a.id === content.id,
              ) as Account;
              Object.keys(account).forEach((k) => {
                if ((content as any)[k] != null)
                  (account as any)[k] = (content as any)[k];
                else Object.keys(account).filter((key) => k !== key);
              });
              exist = true;
            } else {
              return 2;
            }
          }

          content.transactions.forEach((t) => {
            if (t.file) {
              if (
                zip.file(
                  "files/" + t.file.id + "." + t.file.name.split(".").pop(),
                ) == null
              )
                return 3;
            }
          });

          if (!exist) {
            this.accounts.push(content);
            this.SaveAccounts();
          }

          zip.folder("files")!.forEach(async (_, file) => {
            writeFileSync(
              path.join(this.dataPath, file.name),
              await file.async("nodebuffer"),
            );
          });

          return JSON.stringify(content);
        } catch (error) {
          console.log(error);
          return 1;
        }
      } else {
        console.log("No account.json");
        return 1;
      }
    } catch (error) {
      console.log(error);
      return 1;
    }
  }

  CreateAccount(name: string) {
    let id = randomUUID();
    let newAccount = { ...JSON.parse(JSON.stringify(newAccountSchema)) };
    newAccount.id = id;
    newAccount.name = name;
    this.accounts.push(newAccount);

    this.SaveAccounts();
    return id;
  }

  DeleteAccount(id: string) {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    this.SaveAccounts();
  }

  RenameAccount(id: string, name: string) {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) return;
    account.name = name;
    this.SaveAccounts();
  }

  // Transactions
  AddTransaction(
    accountId: string,
    name: string,
    description: string,
    amount: number,
    date: number,
    tag: string,
    file: {
      id: string;
      name: string;
    } | null,
  ) {
    const id = randomUUID();
    const transaction = {
      id,
      created_at: Date.now(),
      name,
      description,
      amount,
      date,
      tag,
      file: null,
    } as Transaction;

    if (file) Object.assign(transaction, { file });
    else Object.assign(transaction, { file: null });

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.transactions.push(transaction);
    this.UpdateBalance(accountId);
    return id;
  }

  PatchTransaction(
    accountId: string,
    transactionId: string,
    data: Transaction,
  ) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    let transaction = account.transactions.find((t) => t.id === transactionId);
    Object.keys(data).forEach((key) => {
      if ((transaction as any)[key] !== undefined) {
        (transaction as any)[key] = (data as any)[key];
      }
    });
    this.UpdateBalance(accountId);
  }

  DeleteTransaction(accountId: string, transactionId: string) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.transactions = account.transactions.filter(
      (t) => t.id !== transactionId,
    );
    this.UpdateBalance(accountId);
  }

  GetTransactions(accountId: string) {
    return this.accounts.find((a) => a.id === accountId)?.transactions;
  }

  GetTransaction(accountId: string, transactionId: string) {
    return this.accounts
      .find((a) => a.id === accountId)
      ?.transactions.find((t) => t.id === transactionId);
  }

  UpdateBalance(accountId: string) {
    let balance = 0;
    let account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.transactions.forEach((t) => {
      balance += t.amount;
    });

    account.balance = parseFloat(balance.toFixed(2));
    this.ComputeCurrentMonthly(accountId);
    this.SaveAccounts();
  }

  CleanFiles() {
    let count = 0;
    const existingFiles = readdirSync(this.filesPath);
    const validFiles: string[] = [];
    this.accounts.forEach((a) => {
      a.transactions.forEach((t) => {
        if (t.file) {
          validFiles.push(t.file.id + "." + t.file.name.split(".").pop());
        }
      });
    });

    existingFiles.forEach((f) => {
      if (validFiles.indexOf(f) == -1) {
        rmSync(path.join(__dirname, "../", this.filesPath + f));
        count++;
      }
    });

    if (count > 0) {
      console.log(`${count} file${count > 1 ? "s" : ""} cleaned`);
    }
  }

  // Monthly
  SetMonthly(accountId: string, newMonthly: number) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    account.monthly = newMonthly;
    this.SaveAccounts();
  }

  ComputeCurrentMonthly(accountId: string) {
    let result = 0;
    let account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.transactions
      .filter(
        (t) =>
          new Date(t.date).getMonth() === new Date(Date.now()).getMonth() &&
          new Date(t.date).getFullYear() === new Date(Date.now()).getFullYear(),
      )
      .forEach((t) => {
        if (t.amount < 0) result += t.amount;
      });

    account.currentMonthly = Math.abs(result);
  }

  // Charts
  CreateChart(
    accountId: string,
    title: string,
    filter: Filter[],
    type: ChartType,
    options:
      | {
          name: string;
          value: string;
        }[]
      | undefined,
  ) {
    const id = randomUUID();
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.charts.push({ id, title, filter, type, options });
    this.SaveAccounts();
    return id;
  }

  DeleteChart(accountId: string, chartId: string) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.charts = account.charts.filter((c) => c.id !== chartId);
    this.SaveAccounts();
  }

  // Tags
  CreateTag(accountId: string, tagName: string, tagColor: string) {
    const id = randomUUID();
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.tags.push({
      id,
      name: tagName || "Default",
      color: tagColor || "#000000",
    });
    this.SaveAccounts();
    return id;
  }

  UpdateTag(
    accountId: string,
    tagId: string,
    tagName: string,
    tagColor: string,
  ) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (account) {
      const tag = account.tags.find((t) => t.id === tagId);
      if (tag) {
        if (tagName) tag.name = tagName;
        if (tagColor) tag.color = tagColor;
        this.SaveAccounts();
        return tag;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  DeleteTag(accountId: string, tagId: string) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    account.tags = account.tags.filter((t) => t.id !== tagId);
    this.SaveAccounts();
  }

  // Settings
  SetSetting(accountId: string, newSetting: Setting) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    let settings = account.settings;
    let setting = settings.find((s) => s.name === newSetting.name);
    if (setting) setting.value = newSetting.value;
    else settings.push(newSetting);
    this.SaveAccounts();
  }

  // Data
  SaveAccounts(saveDb = true) {
    writeFileSync(this.accountsPath, JSON.stringify(this.accounts));
    this.CleanFiles();
    if (saveDb && !this.offline) this.UpdateDatabase();
  }

  async UpdateDatabase() {
    try {
      this.accounts.forEach(async (account) => {
        // Account
        const prismaAccount = {
          id: account.id,
          balance: account.balance,
          monthly: account.monthly,
          currentMonthly: account.currentMonthly,
          name: account.name,
        };
        await prisma.account.upsert({
          where: { id: account.id },
          create: prismaAccount,
          update: prismaAccount,
        });

        // Transaction
        account.transactions.forEach(async (t) => {
          const prismaTransaction = {
            id: t.id,
            amount: t.amount,
            created_at: t.created_at,
            date: t.date,
            description: t.description,
            name: t.name,
            tag: t.tag,
            Account: {
              connect: {
                id: account.id,
              },
            },
          };
          await prisma.transaction.upsert({
            where: { id: t.id },
            create: prismaTransaction,
            update: prismaTransaction,
          });

          if (t.file) {
            const prismaFile = {
              id: t.file.id,
              name: t.file.name,
              Transaction: {
                connect: {
                  id: t.id,
                },
              },
            };

            await prisma.file.upsert({
              where: { id: t.file.id },
              create: prismaFile,
              update: prismaFile,
            });
          }
        });

        await prisma.transaction.deleteMany({
          where: {
            id: {
              notIn: this.accounts.flatMap((a) =>
                a.transactions.map((t) => t.id),
              ),
            },
          },
        });

        await prisma.file.deleteMany({
          where: {
            id: {
              notIn: this.accounts.flatMap((a) =>
                a.transactions
                  .map((t) => t.file?.id)
                  .filter((e) => e != undefined),
              ),
            },
          },
        });

        // Tags
        account.tags.forEach(async (t) => {
          const prismaTag = {
            id: t.id,
            color: t.color,
            name: t.name,
            Account: {
              connect: {
                id: account.id,
              },
            },
          };
          await prisma.transactionTag.upsert({
            where: { id: t.id },
            create: prismaTag,
            update: prismaTag,
          });
        });

        await prisma.transactionTag.deleteMany({
          where: {
            id: {
              notIn: this.accounts.flatMap((a) => a.tags.map((t) => t.id)),
            },
          },
        });
      });

      (await prisma.account.findMany()).forEach(async (a) => {
        const localAccount = this.accounts.find(
          (account) => account.id === a.id,
        );
        if (!localAccount) {
          // Delete File
          (
            await prisma.transaction.findMany({
              where: { Account: { id: a.id } },
            })
          ).forEach((t) => {
            if (t.fileId) {
              prisma.file.delete({
                where: { id: t.fileId, Transaction: { every: { id: t.id } } },
              });
            }
          });

          // Delete Transactions
          await prisma.transaction.deleteMany({
            where: {
              Account: {
                id: a.id,
              },
            },
          });

          await prisma.account.delete({
            where: {
              id: a.id,
            },
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  async LoadDatabase() {
    try {
      this.accounts = [];
      const prisma = new PrismaClient();
      const accountsPromises = (await prisma.account.findMany()).map(
        async (account) => {
          const transactionsPromise = prisma.transaction.findMany({
            where: { Account: { id: account.id } },
          }) as Prisma.PrismaPromise<
            ({
              id: string;
              created_at: number;
              name: string;
              description: string;
              amount: number;
              date: number;
              tag: string;
              fileId: string | null;
              transactionId: string;
            } & {
              file: {
                id: string;
                name: string;
              } | null;
            })[]
          >;
          const tagsPromise = prisma.transactionTag.findMany({
            where: { Account: { id: account.id } },
          });

          const [transactions, tags] = await Promise.all([
            transactionsPromise,
            tagsPromise,
          ]);

          const formattedTransactions = await Promise.all(
            transactions.map(async (t) => {
              if (t.fileId == null) {
                t.file = null;
              } else {
                t.file = await prisma.file.findUnique({
                  where: {
                    id: t.fileId,
                  },
                });
              }
              delete (t as any)["transactionId"];
              delete (t as any)["fileId"];
              return t;
            }),
          );

          const formattedTags = tags.map((t) => {
            delete (t as any)["tagId"];
            return t;
          });

          return {
            ...account,
            charts: [],
            settings: [],
            transactions: formattedTransactions || [],
            tags: formattedTags || [],
          };
        },
      );

      this.accounts = await Promise.all(accountsPromises);
      this.SaveAccounts(false);
    } catch (e) {
      console.error(e);
    }
  }

  SetupFiles() {
    if (!existsSync(this.dataPath)) {
      mkdirSync(this.dataPath);
    }

    if (!existsSync(this.accountsPath)) {
      writeFileSync(this.accountsPath, "[]");
    }
  }
}
