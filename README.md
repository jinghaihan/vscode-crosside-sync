# VSCode Crosside Sync

<a href="https://marketplace.visualstudio.com/items?itemName=octohash.crosside-sync" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/octohash.crosside-sync.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

A powerful VS Code extension that enables seamless synchronization of settings, keybindings, and extensions across VS Code and its forks (like Cursor) using local storage.

## Features

- <samp><b>Cross-IDE Sync</b></samp>: Synchronize settings, keybindings, and extensions between VS Code and its forks
- <samp><b>Local Storage</b></samp>: Uses `~/.crosside-sync` directory for shared storage with full user control
- <samp><b>Auto & Manual Sync</b></samp>: Automatic sync on startup with manual commands for settings, keybindings, and extensions
- <samp><b>Smart Conflict Resolution</b></samp>: Compares modification times to preserve your latest changes
- <samp><b>Extension Management</b></samp>: Sync extensions with filtering options to exclude specific ones

## Configuration

<!-- configs -->

| Key                                   | Description                                                         | Type      | Default              |
| ------------------------------------- | ------------------------------------------------------------------- | --------- | -------------------- |
| `crosside-sync.storagePath`           | The path to store the sync data share between VSCode and its forks. | `string`  | `"~/.crosside-sync"` |
| `crosside-sync.autoSync`              | Whether to automatically sync settings.                             | `boolean` | `true`               |
| `crosside-sync.promptOnAutoSync`      | Should show prompt before auto sync.                                | `boolean` | `true`               |
| `crosside-sync.promptOnExtensionSync` | Should show prompt before sync extensions.                          | `boolean` | `true`               |
| `crosside-sync.excludeExtensions`     | Extensions to exclude from sync.                                    | `array`   | `[]`                 |

<!-- configs -->

## Commands

<!-- commands -->

| Command                                  | Title                           |
| ---------------------------------------- | ------------------------------- |
| `octohash.crosside-sync.syncProfile`     | Crosside Sync: Sync Everything  |
| `octohash.crosside-sync.syncSettings`    | Crosside Sync: Sync Settings    |
| `octohash.crosside-sync.syncKeybindings` | Crosside Sync: Sync Keybindings |
| `octohash.crosside-sync.syncExtensions`  | Crosside Sync: Sync Extensions  |

<!-- commands -->

## Supported Editors

- VS Code
- Cursor
- Other VS Code-based editors (untested)

## Why ?

Many developers use multiple VS Code-based editors simultaneously - VS Code for general development, Cursor for AI-assisted coding, and other forks for specific workflows. Managing consistent settings, keybindings, and extensions across these different environments can be time-consuming and error-prone.

Crosside Sync solves this problem by providing a unified synchronization system that works across all VS Code-based editors. Whether you're switching between VS Code and Cursor, or using multiple machines with different VS Code forks, your development environment stays consistent.

## Credits

This project is highly inspired by [Sync Everything](https://github.com/0x3at/synceverything).

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)
