import { BuildInfo } from "@finance-tracker/types/dist/types";

export const buildInfo: BuildInfo = {
  version: process.env.npm_package_version || "unknown",
  commitHash: process.env.GIT_COMMIT_HASH || "unknown",
  buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
  branch: process.env.GIT_BRANCH || "unknown",
};
