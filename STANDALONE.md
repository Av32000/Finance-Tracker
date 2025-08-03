# Standalone Mode and Binary Compilation

Finance Tracker now supports two new important features:

## 1. Standalone Mode

The standalone mode allows you to run Finance Tracker without connecting to a database, using your user configuration directory to save data instead.

### Usage

Start Finance Tracker with the `--standalone` flag:

```bash
node dist/api/index.js --standalone
```

Or with pnpm:

```bash
pnpm start:server --standalone
```

### Features

- **No Database Required**: Runs completely offline without PostgreSQL
- **User Config Directory**: Data is saved to your user configuration directory:
  - **Windows**: `%APPDATA%\Finance-Tracker`
  - **macOS**: `~/Library/Application Support/Finance-Tracker`
  - **Linux**: `~/.config/Finance-Tracker`
- **Portable Data**: Your data follows you across sessions
- **Same API**: All the same features as the database version

## 2. Binary Compilation

Finance Tracker can be compiled into standalone executables that require no dependencies on the target machine.

### Build Commands

Build for all platforms:
```bash
pnpm build:binary
```

Build for specific platforms:
```bash
pnpm build:binary:win     # Windows (.exe + installer)
pnpm build:binary:mac     # macOS (x64 + arm64)
pnpm build:binary:linux   # Linux (x64)
```

### Generated Files

After building, you'll find the following in the `binaries/` directory:

#### Linux
- `finance-tracker-linux` - Executable for Linux x64

#### Windows
- `finance-tracker-windows.exe` - Executable for Windows x64
- `finance-tracker-windows-installer.bat` - Installer script that:
  - Installs to `%LOCALAPPDATA%\Finance Tracker`
  - Creates desktop shortcut
  - Creates Start Menu entry

#### macOS
- `finance-tracker-macos-x64` - Executable for Intel Macs
- `finance-tracker-macos-arm64` - Executable for Apple Silicon Macs

### Binary Features

- **Zero Dependencies**: No need to install Node.js or any other dependencies
- **Automatic Standalone Mode**: Binaries automatically run in standalone mode
- **Self-Contained**: Everything needed is bundled into the executable
- **Cross-Platform**: Build binaries for Windows, macOS, and Linux from any platform

### Installation

#### Windows
1. Download `finance-tracker-windows.exe` and `finance-tracker-windows-installer.bat`
2. Place both files in the same directory
3. Run `finance-tracker-windows-installer.bat` as Administrator
4. Use the desktop shortcut or Start Menu entry to launch

#### macOS
1. Download the appropriate binary for your Mac:
   - `finance-tracker-macos-x64` for Intel Macs
   - `finance-tracker-macos-arm64` for Apple Silicon Macs
2. Make it executable: `chmod +x finance-tracker-macos-*`
3. Run: `./finance-tracker-macos-*`

Note: On macOS, you may need to allow the app in System Preferences > Security & Privacy.

#### Linux
1. Download `finance-tracker-linux`
2. Make it executable: `chmod +x finance-tracker-linux`
3. Run: `./finance-tracker-linux`

### Development

To add new build targets or modify the compilation process, edit `scripts/build-binary.js`.

The build process:
1. Compiles TypeScript to JavaScript
2. Bundles the application with esbuild
3. Creates a standalone entry point with automatic `--standalone` flag
4. Uses pkg to create platform-specific executables
5. Generates Windows installer script

### Troubleshooting

- **"Cannot find module" errors**: The module might not be properly bundled. Check the esbuild external configuration in `apps/api/package.json`.
- **Binary too large**: This is normal - binaries include the entire Node.js runtime and all dependencies.
- **macOS security warnings**: Use `codesign --sign - <executable>` to ad-hoc sign the binary.