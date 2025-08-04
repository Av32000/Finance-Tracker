import { Account, FTChart, Setting, Transaction } from "@finance-tracker/types";
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

// Conditional Prisma imports - only load when needed
let Prisma: any;
let PrismaClient: any;

try {
  // Skip Prisma loading if explicitly disabled (e.g., in binaries)
  if (process.env.SKIP_PRISMA === 'true') {
    throw new Error('Prisma loading skipped for binary');
  }
  
  const prismaModule = require("@prisma/client");
  Prisma = prismaModule.Prisma;
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // Prisma not available - this is fine for standalone mode
  console.warn("Prisma client not available - running in standalone mode");
}

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

export default class AccountsAPI {
  accounts: Account[] = [];
  dataPath: string;
  filesPath: string;
  offline: boolean;
  accountsPath: string;
  prisma: any = null;

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
        const p = path.join(__dirname, "../", this.filesPath + f);
        if (existsSync(p)) rmSync(p);
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

  // Charts
  CreateChart(accountId: string, chart: FTChart) {
    const id = randomUUID();
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    chart.id = id;
    account.charts.push(chart);
    this.SaveAccounts();
    return id;
  }

  UpdateChart(accountId: string, chart: FTChart) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    account.charts = [
      ...account.charts.filter((c) => c.id !== chart.id),
      chart,
    ];
    this.SaveAccounts();
    return chart;
  }

  DeleteChart(accountId: string, chartId: string) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    account.charts = account.charts.filter((c) => c.id !== chartId);
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

  async checkConnection() {
    if (!PrismaClient) return false; // Prisma not available
    if (!this.prisma) this.prisma = new PrismaClient();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.prisma = null;
      return false;
    }
  }

  async checkPrismaClient() {
    await this.checkConnection();
    return this.prisma;
  }

  async UpdateDatabase() {
    try {
      const prisma = await this.checkPrismaClient();
      if (!prisma) return;

      // Collect all IDs for later use
      const accountIds = this.accounts.map((account) => account.id);
      const transactionIds = this.accounts.flatMap((account) =>
        account.transactions.map((t) => t.id),
      );
      const fileIds = this.accounts.flatMap((account) =>
        account.transactions
          .filter((t) => t.file != null)
          .map((t) => t.file!.id),
      );
      const tagIds = this.accounts.flatMap((account) =>
        account.tags.map((t) => t.id),
      );

      // Process accounts
      const accountUpserts = this.accounts.map((account) => {
        const prismaAccount = {
          id: account.id,
          balance: account.balance,
          monthly: account.monthly,
          currentMonthly: account.currentMonthly,
          name: account.name,
          charts: account.charts,
        };

        return prisma.account.upsert({
          where: { id: account.id },
          create: prismaAccount,
          update: prismaAccount,
        });
      });

      await Promise.all(accountUpserts);

      // Process transactions
      const transactionUpserts = this.accounts.flatMap((account) =>
        account.transactions.map((t) => {
          const prismaTransaction = {
            id: t.id,
            amount: t.amount,
            created_at: t.created_at,
            date: t.date,
            description: t.description,
            name: t.name,
            tag: t.tag,
            Account: {
              connect: { id: account.id },
            },
          };

          return prisma.transaction.upsert({
            where: { id: t.id },
            create: prismaTransaction,
            update: prismaTransaction,
          });
        }),
      );

      await Promise.all(transactionUpserts);

      // Process files - only for transactions that have files
      const fileUpserts = this.accounts.flatMap((account) =>
        account.transactions
          .filter((t) => t.file != null)
          .map((t) => {
            const prismaFile = {
              id: t.file!.id,
              name: t.file!.name,
              Transaction: {
                connect: { id: t.id },
              },
            };

            return prisma.file.upsert({
              where: { id: t.file!.id },
              create: prismaFile,
              update: prismaFile,
            });
          }),
      );

      await Promise.all(fileUpserts);

      // Process tags
      const tagUpserts = this.accounts.flatMap((account) =>
        account.tags.map((t) => {
          const prismaTag = {
            id: t.id,
            color: t.color,
            name: t.name,
            Account: {
              connect: { id: account.id },
            },
          };

          return prisma.transactionTag.upsert({
            where: { id: t.id },
            create: prismaTag,
            update: prismaTag,
          });
        }),
      );

      await Promise.all(tagUpserts);

      // Clean up deleted data
      const cleanupOperations = [
        // Delete transactions that no longer exist in memory
        prisma.transaction.deleteMany({
          where: {
            id: { notIn: transactionIds },
          },
        }),

        // Delete files that no longer exist in memory
        prisma.file.deleteMany({
          where: {
            id: { notIn: fileIds },
          },
        }),

        // Delete tags that no longer exist in memory
        prisma.transactionTag.deleteMany({
          where: {
            id: { notIn: tagIds },
          },
        }),
      ];

      await Promise.all(cleanupOperations);

      // Find accounts in the database that don't exist in memory and delete them
      const dbAccounts = await prisma.account.findMany({
        select: { id: true },
      });

      const accountsToDelete = dbAccounts
        .filter((a: any) => !accountIds.includes(a.id))
        .map((a: any) => a.id);

      if (accountsToDelete.length > 0) {
        // For each account to delete, clean up related records
        await Promise.all(
          accountsToDelete.map(async (accountId: string) => {
            // Find transactions with files
            const transactions = await prisma.transaction.findMany({
              where: {
                Account: { id: accountId },
              },
              select: {
                id: true,
                fileId: true,
              },
            });

            // Delete files first (if any)
            const fileIds = transactions
              .filter((t: any) => t.fileId != null)
              .map((t: any) => t.fileId!);

            if (fileIds.length > 0) {
              await prisma.file.deleteMany({
                where: { id: { in: fileIds } },
              });
            }

            // Delete transaction tags
            await prisma.transactionTag.deleteMany({
              where: { Account: { id: accountId } },
            });

            // Delete transactions
            await prisma.transaction.deleteMany({
              where: { Account: { id: accountId } },
            });

            // Finally delete the account
            await prisma.account.delete({
              where: { id: accountId },
            });
          }),
        );
      }

      return true;
    } catch (error) {
      console.error("Database update failed:", error);
      return false;
    }
  }

  async LoadDatabase() {
    try {
      this.accounts = [];
      const prisma = await this.checkPrismaClient();
      if (!prisma) return;
      const accountsPromises = (await prisma.account.findMany()).map(
        async (account: any) => {
          const transactionsPromise = prisma.transaction.findMany({
            where: { Account: { id: account.id } },
          }) as any;
          const tagsPromise = prisma.transactionTag.findMany({
            where: { Account: { id: account.id } },
          });

          const [transactions, tags] = await Promise.all([
            transactionsPromise,
            tagsPromise,
          ]);

          const formattedTransactions = await Promise.all(
            transactions.map(async (t: any) => {
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

          const formattedTags = tags.map((t: any) => {
            delete (t as any)["tagId"];
            return t;
          });

          return {
            ...account,
            charts: account.charts as FTChart[],
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
