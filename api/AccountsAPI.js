const { randomUUID } = require("crypto");
const {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { PrismaClient } = require("@prisma/client");

const newAccountSchema = {
  id: 0,
  name: "",
  balance: 0,
  transactions: [],
  settings: [],
  monthly: 1000,
  currentMonthly: 0,
  tags: [
    {
      id: "bde71bb0-28ae-491c-ad88-358f83758eca",
      name: "Monthly",
      color: "#6366F1",
    },
    {
      id: "eb1de408-85a9-404a-90dd-6705748b3fd5",
      name: "Food",
      color: "#25B14C",
    },
    {
      id: "30d0edb1-e1c0-423b-82d7-b0c9ca615973",
      name: "Other",
      color: "#646769",
    },
  ],
  charts: [],
};

module.exports = class AccountsAPI {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.accountsPath = path.join(dataPath, "accounts.json");

    this.SetupFiles();
    this.LoadDatabase();
  }

  LoadAccounts() {
    this.accounts = JSON.parse(readFileSync(this.accountsPath).toString());
  }

  // Fix Accounts when account newAccountSchema was changed
  FixAccounts() {
    let fixCount = 0;
    this.accounts.forEach((element) => {
      let fix = false;

      this.UpdateBalance(element.id);

      // Add new keys
      Object.keys(newAccountSchema).forEach((key) => {
        if (element[key] === undefined) {
          element[key] = newAccountSchema[key];
          fix = true;
        }
      });

      // Remove deprecated keys
      Object.keys(element).forEach((key) => {
        if (newAccountSchema[key] === undefined) {
          delete element[key];
          fix = true;
        }
      });

      if (fix) fixCount++;
    });

    if (fixCount > 0) {
      this.SaveAccounts();
      console.log(
        fixCount + " propert" + (fixCount > 1 ? "ies" : "y") + " fixed"
      );
    }
  }

  // Accounts
  GetAccounts() {
    return this.accounts;
  }

  GetAccount(id) {
    return this.accounts.find((a) => a.id === id);
  }

  async ExportAccount(id) {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) return;

    const zip = new JSZip();
    zip.file("account.json", JSON.stringify(account));

    const fileFolder = zip.folder("files");
    Array.prototype;
    account.transactions.forEach((t) => {
      if (t.file) {
        fileFolder.file(
          t.file.id + "." + t.file.name.split(".").pop(),
          readFileSync(
            path.join(
              this.dataPath,
              "files",
              t.file.id + "." + t.file.name.split(".").pop()
            )
          )
        );
      }
    });

    return zip.generateAsync({ type: "nodebuffer" });
  }

  async ImportAccount(file, force) {
    const zip = new JSZip();

    try {
      const zipData = await zip.loadAsync(file);
      let accountFile = zipData.file("account.json");
      let exist = false;
      if (accountFile) {
        try {
          const content = JSON.parse(await accountFile.async("string"));
          if (
            content.id == null ||
            content.name == null ||
            content.transactions == null
          )
            return 1;
          if (this.accounts.find((a) => a.id === content.id)) {
            if (force) {
              const account = this.accounts.find((a) => a.id === content.id);
              Object.keys(account).forEach((k) => {
                if (content[k] != null) account[k] = content[k];
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
                  "files/" + t.file.id + "." + t.file.name.split(".").pop()
                ) == null
              )
                return 3;
            }
          });

          if (!exist) {
            this.accounts.push(content);
            this.SaveAccounts();
          }

          zip.folder("files").forEach(async (relativePath, file) => {
            writeFileSync(
              path.join(this.dataPath, file.name),
              await file.async("nodebuffer")
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

  CreateAccount(name) {
    let id = randomUUID();
    let newAccount = { ...newAccountSchema };
    newAccount.id = id;
    newAccount.name = name;
    this.accounts.push(newAccount);

    this.SaveAccounts();
    return id;
  }

  DeleteAccount(id) {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    this.SaveAccounts();
  }

  RenameAccount(id, name) {
    this.accounts.find((a) => a.id === id).name = name;
    this.SaveAccounts();
  }

  // Transactions
  AddTransaction(accountId, name, description, amount, date, tag, file) {
    const id = randomUUID();
    const transaction = {
      id,
      created_at: Date.now(),
      name,
      description,
      amount,
      date,
      tag,
    };

    if (file) Object.assign(transaction, { file });
    else Object.assign(transaction, { file: null });

    this.accounts
      .find((a) => a.id === accountId)
      .transactions.push(transaction);
    this.UpdateBalance(accountId);
    return id;
  }

  PatchTransaction(accountId, transactionId, data) {
    let transaction = this.accounts
      .find((a) => a.id === accountId)
      .transactions.find((t) => t.id === transactionId);
    Object.keys(data).forEach((key) => {
      if (transaction[key] !== undefined) {
        transaction[key] = data[key];
      }
    });
    this.UpdateBalance(accountId);
  }

  DeleteTransaction(accountId, transactionId) {
    const account = this.accounts.find((a) => a.id === accountId);
    account.transactions = account.transactions.filter(
      (t) => t.id !== transactionId
    );
    this.UpdateBalance(accountId);
  }

  GetTransactions(accountId) {
    return this.accounts.find((a) => a.id === accountId).transactions;
  }

  GetTransaction(accountId, transactionId) {
    return this.accounts
      .find((a) => a.id === accountId)
      .transactions.find((t) => t.id === transactionId);
  }

  UpdateBalance(accountId) {
    let balance = 0;
    let account = this.accounts.find((a) => a.id === accountId);
    account.transactions.forEach((t) => {
      balance += t.amount;
    });

    account.balance = parseFloat(balance.toFixed(2));
    this.ComputeCurrentMonthly(accountId);
    this.SaveAccounts();
  }

  CleanFile(filePath) {
    let count = 0;
    const existingFiles = readdirSync(filePath);
    const validFiles = [];
    this.accounts.forEach((a) => {
      a.transactions.forEach((t) => {
        if (t.file) {
          validFiles.push(t.file.id + "." + t.file.name.split(".").pop());
        }
      });
    });

    existingFiles.forEach((f) => {
      if (validFiles.indexOf(f) == -1) {
        rmSync(path.join(__dirname, "../", filePath + f));
        count++;
      }
    });

    if (count > 0) {
      console.log(`${count} file${count > 1 ? "s" : ""} cleaned`);
    }
  }

  // Monthly
  SetMonthly(accountId, newMonthly) {
    this.accounts.find((a) => a.id === accountId).monthly = newMonthly;
    this.SaveAccounts();
  }

  ComputeCurrentMonthly(accountId) {
    let result = 0;
    let account = this.accounts.find((a) => a.id === accountId);
    account.transactions
      .filter(
        (t) =>
          new Date(t.date).getMonth() === new Date(Date.now()).getMonth() &&
          new Date(t.date).getFullYear() === new Date(Date.now()).getFullYear()
      )
      .forEach((t) => {
        if (t.amount < 0) result += t.amount;
      });

    account.currentMonthly = Math.abs(result);
  }

  // Charts
  CreateChart(accountId, title, filters, type, options) {
    const id = randomUUID();
    this.accounts
      .find((a) => a.id === accountId)
      .charts.push({ id, title, filters, type, options });
    this.SaveAccounts();
    return id;
  }

  DeleteChart(accountId, chartId) {
    const account = this.accounts.find((a) => a.id === accountId);
    account.charts = account.charts.filter((c) => c.id !== chartId);
    this.SaveAccounts();
  }

  // Settings
  SetSetting(accountId, newSetting) {
    let settings = this.accounts.find((a) => a.id === accountId).settings;
    let setting = settings.find((s) => s.name === newSetting.name);
    if (setting) setting.value = newSetting.value;
    else settings.push(newSetting);
    this.SaveAccounts();
  }

  // Data
  SaveAccounts(saveDb = true) {
    writeFileSync(this.accountsPath, JSON.stringify(this.accounts));
    if (saveDb) this.UpdateDatabase();
  }

  async UpdateDatabase() {
    try {
      const prisma = new PrismaClient();
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
              where: { id: t.id },
              create: prismaFile,
              update: prismaFile,
            });
          }
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
      });

      (await prisma.account.findMany()).forEach(async (a) => {
        const localAccount = this.accounts.find(
          (account) => account.id === a.id
        );
        if (!localAccount) {
          // Delete File
          (
            await prisma.transaction.findMany({
              where: { Account: { id: a.id } },
            })
          ).forEach((t) => {
            if (t.file) {
              prisma.file.delete({
                where: { Transaction: { every: { id: t.id } } },
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
          });
          const tagsPromise = prisma.transactionTag.findMany({
            where: { Account: { id: account.id } },
          });

          const [transactions, tags] = await Promise.all([
            transactionsPromise,
            tagsPromise,
          ]);

          const formattedTransactions = transactions.map((t) => {
            delete t["transactionId"];
            delete t["fileId"];
            if (!Object.keys(t).includes("file")) t.file = null;
            return t;
          });

          const formattedTags = tags.map((t) => {
            delete t["tagId"];
            return t;
          });

          return {
            ...account,
            charts: [],
            settings: [],
            transactions: formattedTransactions || [],
            tags: formattedTags || [],
          };
        }
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
};
