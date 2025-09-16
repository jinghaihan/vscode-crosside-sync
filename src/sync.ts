import type { ExtensionContext } from 'vscode'
import type { ExtensionRecommendations, SyncCommandOptions } from './types'
import { window } from 'vscode'
import { codeName, config } from './config'
import { displayName } from './generated/meta'
import { jsonParse, updateExtensionRecommendations } from './json'
import { getExtensions, getExtensionsPath, getKeybindings, getSettings, setExtensions, setKeybindings, setSettings } from './profile'
import { ensureStorageDirectory, getStorageFileUri, readStorageFile, storageFileExists, writeStorageFile } from './storage'
import { compareMtime, findConfigFile, logger } from './utils'

export async function syncProfile(ctx: ExtensionContext, options: SyncCommandOptions = {}) {
  const { prompt = true, silent = false } = options

  let shouldSync = true
  if (prompt) {
    const buttonSync = 'Sync'
    const buttonSkip = 'Skip this time'
    const result = await window.showInformationMessage(
      `${displayName}: do you want to sync your config?`,
      buttonSync,
      buttonSkip,
    )
    shouldSync = result === buttonSync
  }

  if (shouldSync) {
    await ensureStorageDirectory()

    const opts = { ...options, silent: true }
    await Promise.all([
      syncSettings(ctx, opts),
      syncKeybindings(ctx, opts),
      syncExtensions(ctx, { ...opts, prompt: config.promptOnExtensionSync }),
    ])

    if (!silent) {
      window.showInformationMessage(`${displayName}: Config updated`)
    }
  }
}

export async function syncSettings(_ctx: ExtensionContext, options: SyncCommandOptions = {}) {
  const { silent = false } = options
  const settingsPath = await findConfigFile(codeName, 'settings.json')
  if (!settingsPath) {
    logger.error('Settings file not found')
    if (!silent) {
      window.showInformationMessage(`${displayName}: Settings file not found`)
    }
    return
  }

  const hasStorage = await storageFileExists('settings.json')
  if (!hasStorage) {
    await writeStorageFile('settings.json', await getSettings(settingsPath))
    if (!silent) {
      window.showInformationMessage(`${displayName}: Settings file created`)
    }
    return
  }

  const storageUri = getStorageFileUri('settings.json')
  const result = await compareMtime(storageUri.fsPath, settingsPath)

  // storage is newer
  if (result === 1) {
    const settings = await readStorageFile('settings.json')
    await setSettings(settingsPath, settings)
  }
  // settings is newer
  else if (result === -1) {
    const settings = await getSettings(settingsPath)
    await writeStorageFile('settings.json', settings)
  }

  if (!silent) {
    window.showInformationMessage(`${displayName}: Settings updated`)
  }
}

export async function syncKeybindings(_ctx: ExtensionContext, options: SyncCommandOptions = {}) {
  const { silent = false } = options
  const keybindingsPath = await findConfigFile(codeName, 'keybindings.json')
  if (!keybindingsPath) {
    logger.error('Keybindings file not found')
    if (!silent) {
      window.showInformationMessage(`${displayName}: Keybindings file not found`)
    }
    return
  }

  const hasStorage = await storageFileExists('keybindings.json')
  if (!hasStorage) {
    await writeStorageFile('keybindings.json', await getKeybindings(keybindingsPath))
    if (!silent) {
      window.showInformationMessage(`${displayName}: Keybindings file created`)
    }
    return
  }

  const storageUri = getStorageFileUri('keybindings.json')
  const result = await compareMtime(storageUri.fsPath, keybindingsPath)

  // storage is newer
  if (result === 1) {
    const keybindings = await readStorageFile('keybindings.json')
    await setKeybindings(keybindingsPath, keybindings)
  }
  // keybindings is newer
  else if (result === -1) {
    const keybindings = await getKeybindings(keybindingsPath)
    await writeStorageFile('keybindings.json', keybindings)
  }

  if (!silent) {
    window.showInformationMessage(`${displayName}: Keybindings updated`)
  }
}

export async function syncExtensions(_ctx: ExtensionContext, options: SyncCommandOptions = {}) {
  const { prompt = true, silent = false } = options
  const hasStorage = await storageFileExists('extensions.json')
  if (!hasStorage) {
    const extensions = { recommendations: await getExtensions() }
    await writeStorageFile('extensions.json', JSON.stringify(extensions, null, 2))
    if (!silent) {
      window.showInformationMessage(`${displayName}: Extensions file created`)
    }
    return
  }

  const extensions = await readStorageFile('extensions.json')
  const extConfig = jsonParse<ExtensionRecommendations>(extensions)

  const extensionsPath = getExtensionsPath()
  if (!extensionsPath) {
    await setExtensions(extConfig.recommendations, prompt)
    return
  }

  const storageUri = getStorageFileUri('extensions.json')
  const result = await compareMtime(storageUri.fsPath, extensionsPath)

  // storage is newer
  if (result === 1) {
    await setExtensions(extConfig.recommendations, prompt)
  }
  // extensions is newer
  else if (result === -1) {
    const content = updateExtensionRecommendations(extensions, await getExtensions())
    await writeStorageFile('extensions.json', content)
  }

  if (!silent) {
    window.showInformationMessage(`${displayName}: Extensions updated`)
  }
}
