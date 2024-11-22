const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { exit } = require('process');

if (!fs.existsSync(path.join(__dirname, "keys"))) fs.mkdirSync(path.join(__dirname, "keys"))
else if (fs.existsSync(path.join(__dirname, "keys/publicKey.pem")) && fs.existsSync(path.join(__dirname, "keys/privateKey.pem"))) {
  if (process.argv.includes("--force")) {
    console.log("Modifying current keys...");
  } else {
    console.log("Keys already generated (use --force to delete them)");
    exit()
  }
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

fs.writeFileSync(path.join(__dirname, "keys/privateKey.pem"), privateKey);
fs.writeFileSync(path.join(__dirname, "keys/publicKey.pem"), publicKey);

console.log('Keys Generated !');
