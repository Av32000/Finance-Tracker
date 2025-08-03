#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const platformArg = args.find(arg => arg.startsWith('--platform='));
const platform = platformArg ? platformArg.split('=')[1] : 'current';

console.log(`🔨 Building Finance Tracker binary for platform: ${platform}`);

// Define target configurations
const targets = {
  win: ['node18-win-x64'],
  mac: ['node18-macos-x64', 'node18-macos-arm64'],
  linux: ['node18-linux-x64'],
  current: getCurrentPlatformTarget() // Use current platform
};

function getCurrentPlatformTarget() {
  const platform = process.platform;
  const arch = process.arch;
  
  if (platform === 'win32') {
    return ['node18-win-x64'];
  } else if (platform === 'darwin') {
    return arch === 'arm64' ? ['node18-macos-arm64'] : ['node18-macos-x64'];
  } else {
    return ['node18-linux-x64'];
  }
}

const selectedTargets = targets[platform] || targets.current;

// Paths
const distDir = path.join(__dirname, '..', 'dist');
const binariesDir = path.join(__dirname, '..', 'binaries');
const apiDistDir = path.join(distDir, 'api');
const frontDistDir = path.join(distDir, 'front');
const mainScript = path.join(apiDistDir, 'index.js');

// Ensure directories exist
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Check if build exists
if (!fs.existsSync(mainScript)) {
  console.error('❌ API build not found. Please run "pnpm build:server" first.');
  process.exit(1);
}

// Create a standalone entry point that forces --standalone mode
const standaloneEntryPoint = path.join(apiDistDir, 'standalone.js');
const standaloneCode = `
// Standalone entry point for Finance Tracker binary
// This automatically enables standalone mode for the binary

// Force standalone mode
if (!process.argv.includes('--standalone')) {
  process.argv.push('--standalone');
}

// Set NODE_ENV to production for binary
process.env.NODE_ENV = 'production';

// Load the main application
require('./portable.js');
`;

fs.writeFileSync(standaloneEntryPoint, standaloneCode);

// Create pkg configuration
const pkgConfig = {
  scripts: [standaloneEntryPoint],
  assets: [],
  outputPath: binariesDir
};

// Add front-end assets if they exist
if (fs.existsSync(frontDistDir)) {
  console.log('📦 Including front-end assets...');
  pkgConfig.assets.push(`${frontDistDir}/**/*`);
}

// Add any other necessary assets
const assetsToInclude = [
  path.join(apiDistDir, 'KeysGenerator.cjs'),
  path.join(apiDistDir, 'keys/**/*')
];

assetsToInclude.forEach(asset => {
  if (fs.existsSync(asset.replace('/**/*', ''))) {
    pkgConfig.assets.push(asset);
  }
});

console.log('🎯 Building binaries for targets:', selectedTargets);

// Build for each target
selectedTargets.forEach(target => {
  const outputName = getOutputName(target, platform);
  const outputPath = path.join(binariesDir, outputName);
  
  console.log(`🚀 Building for ${target}...`);
  
  try {
    // Use pkg to create the binary
    const pkgCommand = `npx pkg ${standaloneEntryPoint} --target ${target} --output ${outputPath}`;
    if (pkgConfig.assets.length > 0) {
      // Note: pkg doesn't support --assets flag directly, we'll handle assets separately
    }
    
    execSync(pkgCommand, { stdio: 'inherit' });
    console.log(`✅ Successfully built: ${outputPath}`);
    
    // For Windows, create a simple installer script
    if (platform === 'win' && target.includes('win')) {
      createWindowsInstaller(outputPath);
    }
    
  } catch (error) {
    console.error(`❌ Failed to build for ${target}:`, error.message);
    process.exit(1);
  }
});

// Clean up temporary files
fs.unlinkSync(standaloneEntryPoint);

console.log('🎉 Binary build completed!');
console.log(`📁 Binaries created in: ${binariesDir}`);

function getOutputName(target, platform) {
  const baseName = 'finance-tracker';
  
  if (platform === 'current') {
    const currentPlatform = process.platform;
    if (currentPlatform === 'win32') {
      return `${baseName}.exe`;
    } else {
      return baseName;
    }
  }
  
  if (target.includes('win')) {
    return `${baseName}-windows.exe`;
  } else if (target.includes('macos')) {
    const arch = target.includes('arm64') ? 'arm64' : 'x64';
    return `${baseName}-macos-${arch}`;
  } else if (target.includes('linux')) {
    return `${baseName}-linux`;
  }
  
  return baseName;
}

function createWindowsInstaller(binaryPath) {
  const binaryName = path.basename(binaryPath);
  const installerScript = `
@echo off
echo Installing Finance Tracker...

set "INSTALL_DIR=%LOCALAPPDATA%\\Finance Tracker"
set "BINARY_NAME=finance-tracker.exe"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

copy "${binaryName}" "%INSTALL_DIR%\\%BINARY_NAME%"

echo Creating desktop shortcut...
set "SHORTCUT_PATH=%USERPROFILE%\\Desktop\\Finance Tracker.lnk"
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%INSTALL_DIR%\\%BINARY_NAME%'; $Shortcut.Save()"

echo Creating start menu entry...
set "START_MENU_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Finance Tracker"
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"
set "START_MENU_SHORTCUT=%START_MENU_DIR%\\Finance Tracker.lnk"
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_SHORTCUT%'); $Shortcut.TargetPath = '%INSTALL_DIR%\\%BINARY_NAME%'; $Shortcut.Save()"

echo Installation completed!
echo Finance Tracker has been installed to: %INSTALL_DIR%
echo Desktop and Start Menu shortcuts have been created.
pause
`;

  const installerPath = binaryPath.replace('.exe', '-installer.bat');
  fs.writeFileSync(installerPath, installerScript);
  console.log(`📦 Windows installer created: ${installerPath}`);
}