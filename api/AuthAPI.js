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

    if (!this.data.userId) this.data.userId = randomUUID()
    if (!this.data.username) this.data.username = "Fiance Tracker"
    if (!this.data.devices) {
      console.error("\x1b[33m%s\x1b[0m", "No Passkeys found => Data not protected");
      this.data.devices = []
    }
    else {
      this.data.devices.forEach(device => {
        let keyJson = device.credentialPublicKey
        let credentialJson = device.credentialID

        let key = new Uint8Array(Object.values(keyJson))
        let credential = new Uint8Array(Object.values(credentialJson))

        device.credentialPublicKey = key
        device.credentialID = credential
      });
    }


    this.SaveData()
  }


  GetUser() {
    return this.data
  }

  PasskeyExist() {
    return this.data.devices.length > 0
  }

  SetChallenge(challenge) { this.currentChallenge = challenge }
  GetChallenge() { return this.currentChallenge }

  SetOrigin(origin) { this.origin = origin }
  GetOrigin() { return this.origin }

  SaveData() {
    writeFileSync(this.dataPath, JSON.stringify(this.data))
  }
}