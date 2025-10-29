import {
  Account,
  FTChart,
  Setting,
  Transaction,
  TransactionTypeSchema,
  WSEventType,
} from "@finance-tracker/types";
import { randomUUID } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import JSZip, { file } from "jszip";
import path from "path";
import { FTWSServer } from "./ws";

// Conditional Prisma imports - only load when needed
let Prisma: any;
let PrismaClient: any;

try {
  // Skip Prisma loading if explicitly disabled (e.g., in binaries)
  if (process.env.SKIP_PRISMA === "true") {
    throw new Error("Prisma loading skipped for binary");
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
  virtualBalance: 0,
  transactions: [],
  periodicTransactions: [],
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
  wsServer: FTWSServer | undefined;

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

      // Migrate transactions from string tag to array tags
      if (element.transactions) {
        element.transactions.forEach((transaction: any) => {
          if (
            transaction.type === undefined ||
            TransactionTypeSchema.safeParse(transaction.type).success === false
          ) {
            transaction.type = "classic";
            fix = true;
          }

          if (transaction.periodic === undefined) {
            transaction.periodic = null;
            fix = true;
          }

          if (transaction.defered === undefined) {
            transaction.defered = false;
            fix = true;
          }

          if (transaction.tag !== undefined) {
            // Convert single string tag to array format
            transaction.tags =
              transaction.tag === "no_tag" ||
              transaction.tag === "" ||
              !transaction.tag
                ? []
                : [transaction.tag];
            // Remove old 'tag' field
            delete transaction.tag;
            fix = true;
          }
          // Ensure tags field exists as array (for transactions without tags)
          else if (!transaction.tags || !Array.isArray(transaction.tags)) {
            transaction.tags = [];
            fix = true;
          }
        });
      }

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
    transaction: Omit<Transaction, "id" | "created_at">,
    accountId: string,
  ) {
    const id = randomUUID();
    const newTransaction = {
      id,
      ...transaction,
    } as Transaction;

    if (newTransaction.type === "classic" || newTransaction.type === "lend") {
      const account = this.accounts.find((a) => a.id === accountId);
      if (!account) return;

      account.transactions.push(newTransaction);
      this.UpdateBalance(accountId);
    } else if (newTransaction.type === "internal") {
      const sourceAccount = this.accounts.find(
        (a) => a.id === newTransaction.from.id,
      );
      const targetAccount = this.accounts.find(
        (a) => a.id === newTransaction.to.id,
      );

      if (!sourceAccount || !targetAccount) return;

      if (sourceAccount.id === accountId) {
        sourceAccount.transactions.push(newTransaction);
        targetAccount.transactions.push({ ...newTransaction, tags: [] });
      } else {
        targetAccount.transactions.push(newTransaction);
        sourceAccount.transactions.push({ ...newTransaction, tags: [] });
      }

      this.UpdateBalance(sourceAccount.id);
      this.UpdateBalance(targetAccount.id);
    }

    return id;
  }

  PatchTransaction(
    accountId: string,
    transactionId: string,
    data: Transaction,
  ) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    const transaction = account.transactions.find(
      (t) => t.id === transactionId,
    );
    if (!transaction) return;

    // Track which fields should NOT be synchronized across internal transactions
    const fieldsNotToSync = ["tags"];
    const isInternalTransaction = transaction.type === "internal";

    // For internal transactions, check if the other account is changing
    let oldOtherAccountId: string | null = null;
    let newOtherAccountId: string | null = null;
    let accountChanged = false;

    if (isInternalTransaction) {
      oldOtherAccountId =
        transaction.from.id === accountId
          ? transaction.to.id
          : transaction.from.id;

      if (data.type === "internal" && (data.from || data.to)) {
        const updatedFrom = data.from || transaction.from;
        const updatedTo = data.to || transaction.to;

        newOtherAccountId =
          updatedFrom.id === accountId ? updatedTo.id : updatedFrom.id;

        accountChanged = oldOtherAccountId !== newOtherAccountId;
      }
    }

    // If account changed, remove transaction from old other account
    if (accountChanged && oldOtherAccountId) {
      const oldOtherAccount = this.accounts.find(
        (a) => a.id === oldOtherAccountId,
      );
      if (oldOtherAccount) {
        oldOtherAccount.transactions = oldOtherAccount.transactions.filter(
          (t) => t.id !== transactionId,
        );
        this.UpdateBalance(oldOtherAccountId);
      }
    }

    // Update the current transaction
    Object.keys(data).forEach((key) => {
      if ((transaction as any)[key] !== undefined) {
        (transaction as any)[key] = (data as any)[key];
      }
    });

    // For internal transactions, sync fields with the other account
    if (isInternalTransaction && transaction.type === "internal") {
      const currentOtherAccountId =
        transaction.from.id === accountId
          ? transaction.to.id
          : transaction.from.id;
      const otherAccount = this.accounts.find(
        (a) => a.id === currentOtherAccountId,
      );

      if (otherAccount) {
        let otherTransaction = otherAccount.transactions.find(
          (t) => t.id === transactionId,
        );

        // If account changed or transaction doesn't exist in other account, create it
        if (accountChanged || !otherTransaction) {
          otherTransaction = { ...transaction, tags: [] };
          otherAccount.transactions.push(otherTransaction);
        } else {
          // Update existing transaction
          Object.keys(data).forEach((field) => {
            if (
              !fieldsNotToSync.includes(field) &&
              data[field as keyof Transaction] !== undefined
            ) {
              (otherTransaction as any)[field] = (data as any)[field];
            }
          });
        }
        this.UpdateBalance(currentOtherAccountId);
      }
    }

    this.UpdateBalance(accountId);
  }

  DeleteTransaction(accountId: string, transactionId: string) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    const transaction = account.transactions.find(
      (t) => t.id === transactionId,
    );
    if (!transaction) return;

    if (transaction.type === "classic") {
      const account = this.accounts.find((a) => a.id === accountId);
      if (!account) return;

      account.transactions = account.transactions.filter(
        (t) => t.id !== transaction.id,
      );

      this.UpdateBalance(accountId);
    } else if (transaction.type === "internal") {
      const sourceAccount = this.accounts.find(
        (a) => a.id === transaction.from.id,
      );
      const targetAccount = this.accounts.find(
        (a) => a.id === transaction.to.id,
      );

      if (sourceAccount) {
        sourceAccount.transactions = sourceAccount.transactions.filter(
          (t) => t.id !== transaction.id,
        );
        this.UpdateBalance(sourceAccount.id);
      }
      if (targetAccount) {
        targetAccount.transactions = targetAccount.transactions.filter(
          (t) => t.id !== transaction.id,
        );
        this.UpdateBalance(targetAccount.id);
      }
    }
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
    let virtualBalance = 0;
    let account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;

    account.transactions.forEach((t) => {
      const applyTransaction = (t: Transaction) => {
        if (t.type === "classic") {
          virtualBalance += t.amount;
          if (!t.defered) balance += t.amount;
        } else if (t.type === "internal") {
          if (account.id === t.from.id) {
            virtualBalance -= t.amount;
            if (!t.defered) balance -= t.amount;
          } else if (account.id === t.to.id) {
            virtualBalance += t.amount;
            if (!t.defered) balance += t.amount;
          }
        } else if (t.type === "lend") {
          balance += t.amount;
          if (t.reimbursementTransaction != null) {
            virtualBalance += t.amount + t.reimbursementTransaction.amount;
          }
        }
      };

      if (t.periodic != null) {
        const now = new Date();
        let currentOccurence = 0;
        let currentDate = new Date(t.date);
        const periodicRule = t.periodic;

        const advanceDate = () => {
          if (periodicRule.rule.freq === "daily") {
            currentDate.setDate(
              currentDate.getDate() + periodicRule.rule.interval,
            );
          } else if (periodicRule.rule.freq === "weekly") {
            currentDate.setDate(
              currentDate.getDate() + 7 * periodicRule.rule.interval,
            );
          } else if (periodicRule.rule.freq === "monthly") {
            currentDate.setMonth(
              currentDate.getMonth() + periodicRule.rule.interval,
            );
          } else if (periodicRule.rule.freq === "yearly") {
            currentDate.setFullYear(
              currentDate.getFullYear() + periodicRule.rule.interval,
            );
          }
        };

        const processOccurrence = () => {
          if (currentDate > now) return false;

          const mod = periodicRule.modified.find(
            (m) => m.occurence === currentOccurence,
          );
          if (mod && mod.value != null) {
            const modifiedTransaction = account.transactions.find(
              (tr) => tr.id === mod.value,
            );
            if (modifiedTransaction) applyTransaction(modifiedTransaction);
          } else {
            applyTransaction(t);
          }

          currentOccurence++;
          advanceDate();
          return true;
        };

        if (periodicRule.rule.endRule.type === "afterOccurrences") {
          while (currentOccurence < periodicRule.rule.endRule.value) {
            if (!processOccurrence()) break;
          }
        } else {
          const targetDate =
            periodicRule.rule.endRule.type === "afterDate"
              ? new Date(periodicRule.rule.endRule.value)
              : now;

          while (currentDate <= targetDate) {
            if (!processOccurrence()) break;
          }
        }
      } else {
        applyTransaction(t);
      }
    });

    account.balance = parseFloat(balance.toFixed(2));
    account.virtualBalance = parseFloat(virtualBalance.toFixed(2));
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
    if (this.wsServer)
      this.wsServer.broadcast({ type: WSEventType.RefreshEvent });
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
            tag: t.tags,
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
