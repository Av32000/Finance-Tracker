import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import path from "path";

export function getDataPath(standalone: boolean): string {
  if (standalone) {
    // Use user config directory for standalone mode
    const configDir = getConfigDirectory();
    const financeTrackerDir = path.join(configDir, "finance-tracker");

    // Ensure the directory exists
    if (!existsSync(financeTrackerDir)) {
      mkdirSync(financeTrackerDir, { recursive: true });
    }

    return financeTrackerDir;
  } else {
    // Use current working directory (existing behavior)
    return path.resolve("datas");
  }
}

export function getFilesPath(standalone: boolean): string {
  const dataPath = getDataPath(standalone);
  const filesPath = path.join(dataPath, "files");

  // Ensure the files directory exists
  if (!existsSync(filesPath)) {
    mkdirSync(filesPath, { recursive: true });
  }

  return filesPath;
}

function getConfigDirectory(): string {
  const platform = process.platform;

  switch (platform) {
    case "win32":
      return process.env.APPDATA || path.join(homedir(), "AppData", "Roaming");
    case "darwin":
      return path.join(homedir(), "Library", "Application Support");
    case "linux":
    default:
      return process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config");
  }
}
