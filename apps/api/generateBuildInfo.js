#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const getShortCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn(
      "Warning: Could not get short git commit hash:",
      error.message,
    );
    return "unknown";
  }
};

const getBranch = () => {
  try {
    return execSync("git branch --show-current", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn("Warning: Could not get git branch:", error.message);
    return "unknown";
  }
};

const getVersion = () => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync("../../package.json", "utf8"),
    );
    return packageJson.version;
  } catch (error) {
    console.warn(
      "Warning: Could not read package.json version:",
      error.message,
    );
    return "unknown";
  }
};

const buildInfo = {
  version: getVersion(),
  commitHash: getShortCommitHash(),
  branch: getBranch(),
  buildTimestamp: new Date().toISOString(),
};

const buildInfoContent = `
import { BuildInfo } from "@finance-tracker/types";
export const buildInfo: BuildInfo = ${JSON.stringify(buildInfo, null, 2)};
`;

const buildInfoPath = path.join(__dirname, "src", "utils", "buildInfo.ts");
fs.writeFileSync(buildInfoPath, buildInfoContent, "utf8");

console.log("✓ Build information generated successfully");
