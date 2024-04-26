const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

module.exports = class Cmd {
  constructor(accountsAPI) {
    this.accountsAPI = accountsAPI
    readline.setPrompt('> ');
    readline.prompt();

    readline.on('line', (input) => {
      this.processInput(input)
      readline.prompt();
    });
  }

  processInput(input) {
    switch (input.split(" ")[0]) {
      case "help":
        console.log("=== \x1b[32mHelp\x1b[0m ===");
        console.log("\x1b[32mrm-all-data\x1b[0m => Remove all data");
        console.log("\x1b[32mdb-status\x1b[0m   => Show if db is connected");
        console.log("\x1b[32mexit / quit\x1b[0m => Shutdown server");
        break;
      case "rm-all-data":
        this.accountsAPI.accounts = []
        this.accountsAPI.SaveAccounts()
        console.log("All data is deleted !");
        break;
      case "db-status":
        if (this.accountsAPI.offline) {
          console.log("Not connected !");
        } else {
          console.log("Connected !");
        }
        break;
      case "exit":
      case "quit":
        process.exit(0)
      default:
        break;
    }
  }
}