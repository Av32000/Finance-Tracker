const { randomUUID } = require('crypto')
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const path = require("path")

const newAccountSchema = {
  id: 0,
  name: "",
  balance: 0
}

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

  // Fix Accounts when account newAccountSchema was changed
  FixAccounts() {
    let fixCount = 0
    this.accounts.forEach(element => {
      let fix = false

      // Add new keys
      Object.keys(newAccountSchema).forEach(key => {
        if (element[key] == undefined) {
          element[key] = newAccountSchema[key]
          fix = true
        }
      })

      // Remove deprecated keys
      Object.keys(element).forEach(key => {
        if (newAccountSchema[key] == undefined) {
          delete element[key]
          fix = true
        }
      })

      if (fix) fixCount++
    });

    if (fixCount > 0) {
      this.SaveAccounts()
      console.log(fixCount + " propert" + (fixCount > 1 ? "ies" : "y") + " fixed");
    }
  }

  CreateAccount(name) {
    let id = randomUUID()
    let newAccount = { ...newAccountSchema }
    newAccount.id = id
    newAccount.name = name
    this.accounts.push(newAccount)

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