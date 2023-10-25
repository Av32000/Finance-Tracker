const { randomUUID } = require('crypto')
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const path = require("path")

module.exports = class AccountsAPI {
  constructor(dataPath) {
    this.dataPath = dataPath
    this.accountsPath = path.join(dataPath, "accounts.json")

    this.SetupFiles()
    this.LoadAccounts()
  }

  LoadAccounts() {
    this.accounts = JSON.parse(readFileSync(this.accountsPath).toString())
  }

  GetAccounts() {
    return this.accounts
  }

  GetAccount(id) {
    return this.accounts.find(a => a.id === id)
  }

  CreateAccount(name) {
    let id = randomUUID()
    this.accounts.push({
      id,
      name
    })

    this.SaveAccounts()
    return id
  }

  DeleteAccount(id) {
    this.accounts = this.accounts.filter(a => a.id !== id)
    this.SaveAccounts()
  }

  RenameAccount(id, name) {
    this.accounts.find(a => a.id === id).name = name
    this.SaveAccounts()
  }

  SaveAccounts() {
    writeFileSync(this.accountsPath, JSON.stringify(this.accounts))
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