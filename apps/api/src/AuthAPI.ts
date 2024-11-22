import { randomUUID } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import speakeasy from "speakeasy";

type AuthData = {
  userId: string;
  username: string;
  otpSecret: string;
  devices: {
    credentialPublicKey: Uint8Array;
    credentialID: Uint8Array;
    transports: string[];
    counter: number;
  }[];
};

export default class AuthAPI {
  rpID = "localhost";
  rpName = "Finance Tracker";
  expectedOrigin = "";
  otpSecret = "";
  dataPath: string;
  data: AuthData = { userId: "", username: "", otpSecret: "", devices: [] };
  currentChallenge?: string | null;
  origin = "";

  constructor(dataPath: string) {
    this.dataPath = path.join(dataPath, "auth.json");
    this.LoadData();
  }
  LoadData() {
    if (!existsSync(this.dataPath)) {
      writeFileSync(this.dataPath, "{}");
      this.data = { userId: "", username: "", otpSecret: "", devices: [] };
    } else this.data = JSON.parse(readFileSync(this.dataPath).toString());

    if (!this.data.userId) this.data.userId = randomUUID();
    if (!this.data.username) this.data.username = "Fiance Tracker";
    if (!this.data.otpSecret) {
      this.otpSecret = speakeasy.generateSecret().base32;
      this.data.otpSecret = this.otpSecret;
    } else {
      this.otpSecret = this.data.otpSecret;
    }
    if (!this.data.devices) {
      console.error(
        "\x1b[33m%s\x1b[0m",
        "No Passkeys found => Data not protected",
      );
      this.data.devices = [];
    } else {
      this.data.devices.forEach((device) => {
        let keyJson = device.credentialPublicKey;
        let credentialJson = device.credentialID;

        let key = new Uint8Array(Object.values(keyJson));
        let credential = new Uint8Array(Object.values(credentialJson));

        device.credentialPublicKey = key;
        device.credentialID = credential;
      });
    }

    this.SaveData();
  }

  GetUser() {
    return this.data;
  }

  PasskeyExist() {
    return this.data.devices.length > 0;
  }

  SetChallenge(challenge: string | null) {
    this.currentChallenge = challenge;
  }
  GetChallenge() {
    return this.currentChallenge;
  }

  SetOrigin(origin: string) {
    this.origin = origin;
  }
  GetOrigin() {
    return this.origin;
  }

  GetOtpURL() {
    return speakeasy.otpauthURL({
      secret: this.otpSecret,
      encoding: "base32",
      label: "Finance Tracker",
    });
  }

  VerifyOTP(token: string) {
    return speakeasy.totp.verify({
      secret: this.otpSecret,
      encoding: "base32",
      token,
      window: 1,
    });
  }

  SaveData() {
    writeFileSync(this.dataPath, JSON.stringify(this.data));
  }
}
