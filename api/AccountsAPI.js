const { randomUUID } = require('crypto')
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const path = require("path")

const newAccountSchema = {
  id: 0,
  name: "",
  balance: 0,
  transactions: []
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


  // Fix Accounts when account newAccountSchema was changed
  FixAccounts() {
    let fixCount = 0
    this.accounts.forEach(element => {
      let fix = false

      this.UpdateBalance(element.id)

      // Add new keys
      Object.keys(newAccountSchema).forEach(key => {
        if (element[key] === undefined) {
          element[key] = newAccountSchema[key]
          fix = true
        }
      })

      // Remove deprecated keys
      Object.keys(element).forEach(key => {
        if (newAccountSchema[key] === undefined) {
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

  // Accounts

  GetAccounts() {
    return this.accounts
  }

  GetAccount(id) {
    return this.accounts.find(a => a.id === id)
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

  // Transactions
  // TODO : Add type + file + link
  AddTransaction(accountId, name, amount, date) {
    const id = randomUUID()
    const transaction = {
      id,
      created_at: Date.now(),
      name,
      amount,
      date
    }

    this.accounts.find(a => a.id === accountId).transactions.push(transaction)
    this.UpdateBalance(accountId)
    return id
  }

  PatchTransaction(accountId, transactionId, data) {
    let transaction = this.accounts.find(a => a.id === accountId).transactions.find(t => t.id === transactionId)
    Object.keys(data).forEach(key => {
      if (transaction[key] !== undefined) {
        transaction[key] = data[key]
      }
    })
  }

  DeleteTransaction(accountId, transactionId) {
    const account = this.accounts.find(a => a.id === accountId)
    account.transactions = account.transactions.filter(t => t.id !== transactionId)
    this.SaveAccounts()
  }

  GetTransactions(accountId) {
    return this.accounts.find(a => a.id === accountId).transactions
  }

  GetTransaction(accountId, transactionId) {
    return this.accounts.find(a => a.id === accountId).transactions.find(t => t.id === transactionId)
  }

  UpdateBalance(accountId) {
    let balance = 0
    let account = this.accounts.find(a => a.id === accountId)
    account.transactions.forEach(t => {
      balance += t.amount
    })

    account.balance = balance
    this.SaveAccounts()
  }

  // Data

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