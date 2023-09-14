const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const path = require("path")

module.exports = class AccountsAPI {
  constructor(dataPath) {
    this.dataPath = dataPath
    this.accountsPath = path.join(dataPath, "accounts.json")

    this.SetupFiles()
  }

  LoadAccounts() {
    this.accountsPath = readFileSync(this.accountsPath).toJSON()
  }

  SetupFiles() {
    if (!existsSync(this.dataPath)) {
      mkdirSync(this.dataPath)
    }

    if (!existsSync(this.accountsPath)) {
      writeFileSync(this.accountsPath, "[]")
    }
  }
}