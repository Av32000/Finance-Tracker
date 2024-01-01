const { randomUUID } = require("crypto")
const { existsSync, writeFileSync, readFileSync } = require("fs")
const path = require("path")

module.exports = class AuthAPI {
  rpID = "localhost"
  rpName = 'Finance Tracker'
  expectedOrigin = ""

  constructor(dataPath) {
    this.dataPath = path.join(dataPath, "auth.json")
    this.LoadData()
  }
  LoadData() {
    if (!existsSync(this.dataPath)) {
      writeFileSync(this.dataPath, "{}")
      this.data = {}
    }
    else this.data = JSON.parse(readFileSync(this.dataPath).toString())

    if (!this.data.user) this.data.user = { userId: randomUUID(), username: "Finance Tracker", devices: [] }
    if (!this.data.user.userId) this.data.userId = randomUUID()
    if (!this.data.user.username) this.data.username = "Fiance Tracker"
    if (!this.data.user.devices) this.data.devices = []

    this.SaveData()
  }


  GetUser() {
    console.log(this.data.user);
    return this.data.user
  }

  PasskeyExist() {
    return this.data.user.devices.length > 0
  }

  SetChallenge(challenge) { this.currentChallenge = challenge }
  GetChallenge() { return this.currentChallenge }

  SetOrigin(origin) { this.origin = origin }
  GetOrigin() { return this.origin }

  SaveData() {
    writeFileSync(this.dataPath, JSON.stringify(this.data))
  }
}