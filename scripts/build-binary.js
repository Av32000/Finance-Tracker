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
const binariesDir = path.join(__dirname, '..', 'bin');
const apiDistDir = path.join(distDir, 'api');
const frontDistDir = path.join(distDir, 'front');
const mainScript = path.join(apiDistDir, 'index.js');

// Ensure directories exist
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Build frontend and API if not exists
if (!fs.existsSync(mainScript)) {
  console.log('🔧 Building API...');
  execSync('npm run build:server', { stdio: 'inherit' });
}

if (!fs.existsSync(frontDistDir)) {
  console.log('🎨 Building frontend...');
  execSync('npm run build:react', { stdio: 'inherit' });
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

// Prevent Prisma from loading
process.env.SKIP_PRISMA = 'true';

// Load the main application
require('./portable.js');
`;

fs.writeFileSync(standaloneEntryPoint, standaloneCode);

console.log('🎯 Building binaries for targets:', selectedTargets);

// Build for each target
selectedTargets.forEach(target => {
  const outputName = getOutputName(target, platform);
  const outputPath = path.join(binariesDir, outputName);
  
  console.log(`🚀 Building for ${target}...`);
  
  try {
    // Use pkg with configuration file for better asset handling
    const pkgCommand = `npx pkg --config pkg.json --target ${target} --output ${outputPath} ${standaloneEntryPoint}`;
    
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
  const binariesDir = path.dirname(binaryPath);
  
  // Create NSIS installer script
  const nsisScript = `
; Finance Tracker NSIS Installer Script
!define APP_NAME "Finance Tracker"
!define APP_VERSION "1.0.1"
!define APP_PUBLISHER "Finance Tracker"
!define APP_EXE "finance-tracker.exe"
!define APP_ICON ""

; Include required libraries
!include "MUI2.nsh"
!include "FileFunc.nsh"

; General Settings
Name "\${APP_NAME}"
OutFile "\${APP_NAME}-Setup.exe"
InstallDir "$LOCALAPPDATA\\\${APP_NAME}"
InstallDirRegKey HKCU "Software\\\${APP_NAME}" ""
RequestExecutionLevel user

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "\${NSISDIR}\\Contrib\\Graphics\\Icons\\modern-install.ico"
!define MUI_UNICON "\${NSISDIR}\\Contrib\\Graphics\\Icons\\modern-uninstall.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; License
LicenseData "LICENSE.txt"

; Installer Section
Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy binary
  File "${binaryName}"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  
  ; Registry entries
  WriteRegStr HKCU "Software\\\${APP_NAME}" "" $INSTDIR
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${APP_NAME}" "DisplayName" "\${APP_NAME}"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${APP_NAME}" "UninstallString" "$INSTDIR\\Uninstall.exe"
  
  ; Create Desktop Shortcut
  CreateShortCut "$DESKTOP\\\${APP_NAME}.lnk" "$INSTDIR\\\${APP_EXE}"
  
  ; Create Start Menu Shortcuts
  CreateDirectory "$SMPROGRAMS\\\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\\\${APP_NAME}\\\${APP_NAME}.lnk" "$INSTDIR\\\${APP_EXE}"
  CreateShortCut "$SMPROGRAMS\\\${APP_NAME}\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"
SectionEnd

; Uninstaller Section
Section "Uninstall"
  ; Remove files
  Delete "$INSTDIR\\\${APP_EXE}"
  Delete "$INSTDIR\\Uninstall.exe"
  RMDir "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\\\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\\\${APP_NAME}\\\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\\\${APP_NAME}\\Uninstall.lnk"
  RMDir "$SMPROGRAMS\\\${APP_NAME}"
  
  ; Remove registry entries
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${APP_NAME}"
  DeleteRegKey HKCU "Software\\\${APP_NAME}"
SectionEnd
`;

  const nsisScriptPath = path.join(binariesDir, 'installer.nsi');
  fs.writeFileSync(nsisScriptPath, nsisScript);
  
  // Create a simple LICENSE.txt file if it doesn't exist
  const licensePath = path.join(binariesDir, 'LICENSE.txt');
  if (!fs.existsSync(licensePath)) {
    fs.writeFileSync(licensePath, `Finance Tracker

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`);
  }
  
  console.log(`📦 NSIS installer script created: ${nsisScriptPath}`);
  console.log('ℹ️  To build the installer, run: makensis installer.nsi');
  console.log('   (Requires NSIS to be installed: https://nsis.sourceforge.io/)');
}