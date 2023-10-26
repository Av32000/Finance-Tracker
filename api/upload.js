const multer = require('multer');
const { randomUUID } = require("crypto")
const { existsSync, mkdirSync } = require("fs")

const filesPath = "datas/files/"

if (!existsSync(filesPath)) mkdirSync(filesPath)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesPath);
  },
  filename: (req, file, cb) => {
    cb(null, randomUUID() + "." + file.originalname.split(".").pop());
  }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = { upload, filePath: filesPath };

