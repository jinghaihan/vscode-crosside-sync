# VSCode Crosside Sync

A powerful VS Code extension that enables seamless synchronization of settings, keybindings, and extensions across VS Code and its forks (like Cursor) using local storage.

## Features

- **Cross-IDE Sync**: Synchronize settings, keybindings, and extensions between VS Code and its forks
- **Local Storage**: Uses `~/.crosside-sync` directory for shared storage with full user control
- **Auto & Manual Sync**: Automatic sync on startup with manual commands for settings, keybindings, and extensions
- **Smart Conflict Resolution**: Compares modification times to preserve your latest changes
- **Extension Management**: Sync extensions with filtering options to exclude specific ones

## Commands

Access all commands through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **`Crosside Sync: Sync Everything`** - Sync everything (settings, keybindings, extensions)
- **`Crosside Sync: Sync Settings`** - Only sync settings files
- **`Crosside Sync: Sync Keybindings`** - Only sync keybindings files
- **`Crosside Sync: Sync Extensions`** - Only sync extensions

## Configuration

Configure the extension behavior through VS Code settings:

```json
{
  "crosside-sync.storagePath": "~/.crosside-sync",
  "crosside-sync.autoSync": true,
  "crosside-sync.promptOnSync": true,
  "crosside-sync.excludeExtensions": []
}
```

- **`crosside-sync.storagePath`** (`string`, default: `"~/.crosside-sync"`) - Path to the shared storage directory
- **`crosside-sync.autoSync`** (`boolean`, default: `true`) - Whether to automatically sync on startup
- **`crosside-sync.promptOnSync`** (`boolean`, default: `true`) - Show confirmation prompt before sync
- **`crosside-sync.excludeExtensions`** (`string[]`, default: `[]`) - List of extension IDs to exclude from sync

## Installation

1. Open VS Code or any VS Code-based editor
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Crosside Sync"
4. Click Install

## Usage

After installation, the extension will automatically create the storage directory. On first run, it will sync your current settings to the shared storage

- **Automatic**: The extension syncs automatically on startup (if enabled)
- **Manual**: Use the sync commands when you want to update specific settings

## Supported Editors

- VS Code
- Cursor
- Other VS Code-based editors (untested)

## Why Crosside Sync?

Many developers use multiple VS Code-based editors simultaneously - VS Code for general development, Cursor for AI-assisted coding, and other forks for specific workflows. Managing consistent settings, keybindings, and extensions across these different environments can be time-consuming and error-prone.

Crosside Sync solves this problem by providing a unified synchronization system that works across all VS Code-based editors. Whether you're switching between VS Code and Cursor, or using multiple machines with different VS Code forks, your development environment stays consistent.

## Credits

This project is highly inspired by [Sync Everything](https://github.com/0x3at/synceverything).

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)
