import { writeFileSync } from "fs";
import { join } from "path";
import AccountsAPI from "./AccountsAPI";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

export default class Cmd {
  accountsAPI: AccountsAPI;
  constructor(accountsAPI: AccountsAPI) {
    this.accountsAPI = accountsAPI;
    readline.setPrompt("> ");
    readline.prompt();

    readline.on("line", (input: string) => {
      this.processInput(input).then(() => readline.prompt());
    });
  }

  async processInput(input: string) {
    switch (input.split(" ")[0]) {
      case "help":
        console.log("=== \x1b[32mHelp\x1b[0m ===");
        console.log("\x1b[32mrm-all-data\x1b[0m => Remove all data");
        console.log("\x1b[32mdb-status\x1b[0m   => Show if db is connected");
        console.log(
          "\x1b[32mexport [Account ID] (Path)\x1b[0m => Export the provided account",
        );
        console.log("\x1b[32mexit / quit\x1b[0m => Shutdown server");
        break;
      case "rm-all-data":
        this.accountsAPI.accounts = [];
        this.accountsAPI.SaveAccounts();
        console.log("All data is deleted !");
        break;
      case "db-status":
        if (await this.accountsAPI.checkConnection()) {
          console.log("Connected !");
        } else {
          console.log("Not connected !");
        }
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
        break;
      case "exit":
      case "quit":
        process.exit(0);
      default:
        break;
    }
  }
}
