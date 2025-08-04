import { randomUUID } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";
import AccountsAPI from "./AccountsAPI";

// Conditional Prisma import
let PrismaClient: any;
try {
  // Skip Prisma loading if explicitly disabled (e.g., in binaries)
  if (process.env.SKIP_PRISMA === 'true') {
    throw new Error('Prisma loading skipped for binary');
  }
  
  const prismaModule = require("@prisma/client");
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  console.warn("Prisma client not available - some commands may not work");
}

const prisma = PrismaClient ? new PrismaClient() : null;

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

export default class Cmd {
  accountsAPI: AccountsAPI;
  debugMode: boolean = false;

  constructor(accountsAPI: AccountsAPI) {
    this.accountsAPI = accountsAPI;
    readline.setPrompt("> ");
    readline.prompt();

    readline.on("line", (input: string) => {
      this.processInput(input).then(() => readline.prompt());
    });
  }

  async processInput(input: string) {
    let isValid = false;
    switch (input.split(" ")[0]) {
      case "help":
        console.log("=== \x1b[32mHelp\x1b[0m ===");
        console.log("\x1b[32mdb-status\x1b[0m => Show if db is connected");
        console.log("\x1b[32mlist-accounts\x1b[0m => List all accounts");
        console.log("\x1b[32mcreate-account\x1b[0m => Create an account");
        console.log("\x1b[32mdelete-account\x1b[0m => Delete an account");
        console.log(
          "\x1b[32mexport [Account ID] (Path)\x1b[0m => Export the provided account",
        );
        console.log(
          "\x1b[32mdebug-mode [status]\x1b[0m => Change the debug mode status",
        );
        console.log("\x1b[32mexit / quit\x1b[0m => Shutdown server");
        if (this.debugMode) {
          console.log("--- \x1b[32mDebug Mode\x1b[0m ---");
          console.log("\x1b[32mrm-all-data\x1b[0m => Remove all data");
          console.log(
            "\x1b[32mgenerate-random [count] (Account ID)\x1b[0m => Generate random data in an account",
          );
        }
        isValid = true;
        break;
      case "rm-all-data":
        if (this.debugMode) {
          this.accountsAPI.accounts = [];
          this.accountsAPI.SaveAccounts();
          console.log("All data deleted");
          isValid = true;
        }
        break;
      case "list-accounts":
        console.log(
          `[${this.accountsAPI.accounts
            .map((a) => JSON.stringify({ id: a.id, name: a.name }))
            .join(",\n")}]`,
        );
        isValid = true;
        break;
      case "create-account":
        const name = input.split(" ").slice(1).join(" ");
        if (name) {
          console.log(
            `Account ${name} created with id ${this.accountsAPI.CreateAccount(name)}`,
          );
        } else {
          console.log("Please provide a name");
        }
        isValid = true;
        break;
      case "delete-account":
        const dAccountId = input.split(" ")[1];
        if (this.accountsAPI.GetAccount(dAccountId)) {
          this.accountsAPI.DeleteAccount(dAccountId);
          console.log(`Account ${dAccountId} deleted`);
        } else {
          console.log("Account doen't exist");
        }
        isValid = true;
        break;
      case "db-status":
        if (await this.accountsAPI.checkConnection()) {
          console.log("Connected !");
        } else {
          console.log("Not connected !");
        }
        isValid = true;
        break;
      case "debug-mode":
        const status = input.split(" ")[1].toLowerCase();
        isValid = true;
        switch (status) {
          case "on":
          case "yes":
          case "enabled":
          case "true":
            this.debugMode = true;
            break;

          case "off":
          case "no":
          case "disabled":
          case "false":
            this.debugMode = false;
            break;

          case "toggle":
            this.debugMode = !this.debugMode;
            break;

          default:
            console.log("Invalid State");
            isValid = false;
            break;
        }

        if (isValid)
          console.log(`Debug Mode : ${this.debugMode ? "On" : "Off"}`);
        break;
      case "export":
        const accountId = input.split(" ")[1];
        let path = input.split(" ")[2];
        if (!accountId) console.log("Please provide an account ID");
        else if (accountId == "*") {
          console.log("Not implemented now");
        } else {
          const accountData = this.accountsAPI.GetAccount(accountId);
          if (accountData) {
            if (path) {
              try {
                if (!path.endsWith(".zip"))
                  path = join(path, accountData.name + ".zip");
                writeFileSync(
                  path,
                  (await this.accountsAPI.ExportAccount(accountId)) as Buffer,
                );
                console.log("Account exported in " + path);
              } catch (error) {
                console.error("Unable to write file in provided path");
              }
            } else {
              writeFileSync(
                join(__dirname, accountData.name + ".zip"),
                (await this.accountsAPI.ExportAccount(accountId)) as Buffer,
              );
              console.log(
                "Account exported in " +
                  join(__dirname, accountData.name + ".zip"),
              );
            }
          } else {
            console.log("Account doen't exist");
          }
        }
        isValid = true;
        break;
      case "generate-random":
        const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (this.debugMode) {
          const count = parseInt(input.split(" ")[1]);
          let accountId = input.split(" ")[2];

          if (!isNaN(count)) {
            if (!accountId) {
              accountId = this.accountsAPI.CreateAccount(
                `Random - ${this.accountsAPI.accounts.length}`,
              );
            }

            if (this.accountsAPI.GetAccount(accountId)) {
              const tags =
                this.accountsAPI.GetAccount(accountId)?.tags.map((t) => t.id) ||
                [];
              tags.push("no_tag");

              // Tags
              const tagCount =
                tags.length > 4 ? 0 : Math.floor(Math.random() * (5 + 1));
              for (let i = 0; i < tagCount; i++) {
                const name = i.toString();
                const color =
                  "#" +
                  Math.floor(Math.random() * 0xffffff)
                    .toString(16)
                    .padStart(6, "0");
                tags.push(
                  this.accountsAPI.CreateTag(accountId, name, color) as string,
                );

                await new Promise((resolve) => setTimeout(resolve, 800));
              }

              // Transactions
              for (let i = 0; i < count; i++) {
                const name = Math.random()
                  .toString(36)
                  .substring(
                    2,
                    2 + (Math.floor(Math.random() * (20 - 3 + 1)) + 3),
                  );
                const amount =
                  Math.round((Math.random() * 2000 - 1000) * 100) / 100;
                const description =
                  Math.random() < 0.5
                    ? Math.random()
                        .toString(36)
                        .substring(
                          2,
                          2 + (Math.floor(Math.random() * (250 - 10 + 1)) + 10),
                        )
                    : "";
                const date =
                  Math.floor(
                    Math.random() * (now + twoYears - (now - twoYears) + 1),
                  ) +
                  (now - twoYears);
                const tag = tags[Math.floor(Math.random() * tags.length)];
                const file =
                  Math.random() < 0.5
                    ? {
                        id: randomUUID(),
                        name: Math.random()
                          .toString(36)
                          .substring(
                            2,
                            2 + (Math.floor(Math.random() * (20 - 3 + 1)) + 3),
                          ),
                      }
                    : null;

                this.accountsAPI.AddTransaction(
                  accountId,
                  name,
                  description,
                  amount,
                  date,
                  tag,
                  file,
                );

                await new Promise((resolve) => setTimeout(resolve, 800));
              }

              console.log(
                this.accountsAPI.GetTransactions(accountId)?.map((t) => t.id),
              );

              console.log(
                `\x1b[32m${count}\x1b[0m transactions and \x1b[32m${tagCount}\x1b[0m tag${tagCount > 1 ? "s" : ""} created`,
              );
            } else {
              console.log("Account doen't exist");
            }
          } else {
            console.log("Invalid Count provided");
          }
          isValid = true;
        }
        break;
      case "exit":
      case "quit":
        process.exit(0);
      case "":
        isValid = true;
      default:
        break;
    }

    if (!isValid) {
      console.log(`\x1b[31mUnknown command : ${input.split(" ")[0]}\x1b[0m`);
    }
  }
}
