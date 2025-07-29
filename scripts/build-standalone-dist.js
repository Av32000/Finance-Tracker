#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help flag
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
🔧 Finance Tracker Standalone Distribution Builder

Usage: node build-standalone-dist.js [options]

Options:
  --platform=PLATFORM    Target platform for cross-platform builds
                         Valid platforms: win32, darwin, linux, freebsd, openbsd, sunos, aix
                         Default: current platform (${os.platform()})
  -h, --help             Show this help message

Examples:
  node build-standalone-dist.js                    # Build for current platform
  node build-standalone-dist.js --platform=win32   # Build for Windows
  node build-standalone-dist.js --platform=darwin  # Build for macOS
  node build-standalone-dist.js --platform=linux   # Build for Linux

Note: Cross-platform builds will not include the Node.js binary.
Users on the target platform will need Node.js installed.
`);
  process.exit(0);
}

const platformArg = args.find((arg) => arg.startsWith("--platform="));
const targetPlatform = platformArg ? platformArg.split("=")[1] : os.platform();

// Validate platform
const validPlatforms = [
  "win32",
  "darwin",
  "linux",
  "freebsd",
  "openbsd",
  "sunos",
  "aix",
];
if (!validPlatforms.includes(targetPlatform)) {
  console.error(`❌ Invalid platform: ${targetPlatform}`);
  console.error(`   Valid platforms: ${validPlatforms.join(", ")}`);
  process.exit(1);
}

const projectRoot = path.dirname(__dirname);
const distDir = path.join(projectRoot, "dist");
const binDir = path.join(projectRoot, "bin");

// Create platform-specific bin directory for cross-platform builds
const platformBinDir =
  targetPlatform !== os.platform()
    ? path.join(projectRoot, "bin", targetPlatform)
    : binDir;

// Ensure bin directory exists
if (!fs.existsSync(platformBinDir)) {
  fs.mkdirSync(platformBinDir, { recursive: true });
}

console.log(`🔧 Creating standalone distribution for ${targetPlatform}...`);
if (targetPlatform !== os.platform()) {
  console.log(
    `📦 Cross-platform build detected (host: ${os.platform()}, target: ${targetPlatform})`,
  );
}

const platform = targetPlatform;
const isWindows = platform === "win32";

// Create a self-contained executable script
const scriptName = isWindows ? "finance-tracker.bat" : "finance-tracker";
const scriptPath = path.join(platformBinDir, scriptName);

let scriptContent;

if (isWindows) {
  // Windows batch script
  scriptContent = `@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "NODE_EXE=%SCRIPT_DIR%node.exe"
set "PORTABLE_JS=%SCRIPT_DIR%dist\\api\\portable.js"
set "NODE_ENV=production"

REM Check if node.exe exists in the same directory
if exist "%NODE_EXE%" (
    "%NODE_EXE%" "%PORTABLE_JS%" --standalone %*
) else (
    REM Fall back to system node
    node "%PORTABLE_JS%" --standalone %*
)
`;
} else {
  // Unix shell script
  scriptContent = `#!/bin/bash
# Finance Tracker Standalone Executable
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
NODE_EXE="$SCRIPT_DIR/node"
PORTABLE_JS="$SCRIPT_DIR/dist/api/portable.js"

export NODE_ENV=production

# Check if node binary exists in the same directory
if [ -f "$NODE_EXE" ]; then
    "$NODE_EXE" "$PORTABLE_JS" --standalone "$@"
else
    # Fall back to system node
    node "$PORTABLE_JS" --standalone "$@"
fi
`;
}

// Write the script
fs.writeFileSync(scriptPath, scriptContent);

// Make executable on Unix systems
if (!isWindows) {
  fs.chmodSync(scriptPath, "755");
}

// Copy the complete dist directory
console.log("📁 Copying application files...");
const targetDistDir = path.join(platformBinDir, "dist");
if (fs.existsSync(targetDistDir)) {
  execSync(`rm -rf "${targetDistDir}"`, { stdio: "inherit" });
}
execSync(`cp -r "${distDir}" "${targetDistDir}"`, { stdio: "inherit" });

// Copy Node.js binary for true standalone operation (optional)
console.log("📋 Optionally copying Node.js binary for complete standalone...");
try {
  let nodeExecutable;

  // For cross-platform builds, warn that Node.js binary won't be included
  if (targetPlatform !== os.platform()) {
    console.log(
      `⚠️  Cross-platform build: Node.js binary for ${targetPlatform} not included`,
    );
    console.log(
      `   Users will need Node.js installed on their ${targetPlatform} system`,
    );
    throw new Error("Cross-platform build - skipping Node.js binary");
  }

  nodeExecutable = execSync("which node", { encoding: "utf8" }).trim();
  const targetNodePath = path.join(
    platformBinDir,
    isWindows ? "node.exe" : "node",
  );

  fs.copyFileSync(nodeExecutable, targetNodePath);
  if (!isWindows) {
    fs.chmodSync(targetNodePath, "755");
  }
  console.log("✅ Node.js binary included for complete standalone operation");
} catch (e) {
  console.log("⚠️  Could not copy Node.js binary, will use system Node.js");
}

// Create a README for the binary distribution
const readmePath = path.join(platformBinDir, "README.md");
const readmeContent = `# Finance Tracker Standalone Distribution

This is a standalone distribution of Finance Tracker that includes everything needed to run the application.

## Usage

### Quick Start
\`\`\`bash
# Run with default settings
./${scriptName}

# Run on a specific port
./${scriptName} --port=8080

# Run with custom data directory
./${scriptName} --data-dir=/path/to/data

# Show help (after starting, type 'help' in the console)
./${scriptName}
\`\`\`

### Command Line Options

- \`--port=PORT\`: Set the server port (default: 3000)
- \`--host=HOST\`: Set the server host (default: localhost)  
- \`--data-dir=PATH\`: Use a custom data directory
- \`--insecure\`: Disable authentication (for development/testing only)

### Data Storage

Data is automatically stored in your user configuration directory:
- **Linux**: \`~/.config/finance-tracker\`
- **macOS**: \`~/Library/Application Support/finance-tracker\`
- **Windows**: \`%APPDATA%/finance-tracker\`

You can override this with the \`--data-dir\` option.

### Accessing the Application

After starting, open your web browser and go to:
\`http://localhost:3000\` (or the port you specified)

### Stopping the Application

In the application console, type \`quit\` or \`exit\`, or press Ctrl+C.

## Troubleshooting

### Node.js Not Found
If you get a "node command not found" error, you need to install Node.js:
- Download from: https://nodejs.org/
- Or use your system package manager

### Permission Denied
On Linux/macOS, make sure the script is executable:
\`\`\`bash
chmod +x ${scriptName}
\`\`\`

### Port Already in Use
If port 3000 is already in use, specify a different port:
\`\`\`bash
./${scriptName} --port=8080
\`\`\`
`;

fs.writeFileSync(readmePath, readmeContent);

// Calculate distribution size
let totalSize = 0;
const calculateSize = (dir) => {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.lstatSync(filePath); // Use lstatSync to handle symlinks
        if (stat.isDirectory() && !stat.isSymbolicLink()) {
          calculateSize(filePath);
        } else if (stat.isFile()) {
          totalSize += stat.size;
        }
      } catch (e) {
        // Skip files that can't be read
        console.log(`⚠️  Skipping ${filePath}: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`⚠️  Skipping directory ${dir}: ${e.message}`);
  }
};

calculateSize(platformBinDir);

console.log("");
console.log("✅ Standalone distribution created successfully!");
console.log(`🎯 Target platform: ${targetPlatform}`);
console.log(`📁 Location: ${platformBinDir}`);
console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log("");
console.log("🚀 Usage:");
console.log(`   cd ${platformBinDir}`);
console.log(`   ./${scriptName}`);
console.log("");
if (targetPlatform !== os.platform()) {
  console.log("📋 Cross-platform build notes:");
  console.log(
    `   - Transfer the ${path.basename(platformBinDir)} directory to a ${targetPlatform} system`,
  );
  console.log(`   - Ensure Node.js is installed on the target system`);
  console.log("");
}
console.log("");
console.log("📄 Files included:");
console.log(`   ${scriptName} - Main executable`);
console.log(`   dist/ - Application files`);
console.log(
  `   node${isWindows ? ".exe" : ""} - Node.js runtime (if available)`,
);
console.log(`   README.md - Usage instructions`);
console.log("");
console.log("🌐 After starting, open: http://localhost:3000");
