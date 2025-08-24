import type { Extension } from 'vscode'
import type { ExtensionConfig, ExtensionsDiff } from './types'
import { Buffer } from 'node:buffer'
import { dirname, join } from 'node:path'
import { commands, extensions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { config } from './config'
import { extensionId } from './generated/meta'
import { logger, readFile } from './utils'

export async function getSettings(path: string) {
  try {
    const fileUri = Uri.file(path)
    const buffer = await workspace.fs.readFile(fileUri)
    return Buffer.from(buffer).toString('utf-8')
  }
  catch (error) {
    logger.error(`Failed to read settings file: ${path}`, error)
    throw error
  }
}

export async function setSettings(path: string, settings: string | Record<string, unknown>) {
  try {
    const content = typeof settings === 'string'
      ? settings
      : JSON.stringify(settings, null, 2)
    await workspace.fs.writeFile(Uri.file(path), Buffer.from(content, 'utf8'))
    logger.info(`Settings updated: ${path}`)
  }
  catch (error) {
    logger.error(`Failed to write settings file: ${path}`, error)
    throw error
  }
}

export async function getKeybindings(path: string) {
  try {
    const fileUri = Uri.file(path)
    const buffer = await workspace.fs.readFile(fileUri)
    return Buffer.from(buffer).toString('utf-8')
  }
  catch (error) {
    logger.error(`Failed to read keybindings file: ${path}`, error)
    throw error
  }
}

export async function setKeybindings(path: string, keybindings: string[] | string) {
  try {
    const content = typeof keybindings === 'string'
      ? keybindings
      : JSON.stringify(keybindings, null, 2)
    await workspace.fs.writeFile(Uri.file(path), Buffer.from(content, 'utf8'))
    logger.info(`Keybindings updated: ${path}`)
  }
  catch (error) {
    logger.error(`Failed to write keybindings file: ${path}`, error)
    throw error
  }
}

function normalizeExtensions(extensions: string[]): string[] {
  const excludes = (config.excludeExtensions as string[]).map(id => id.toLowerCase())
  return extensions.map(id => id.toLowerCase()).filter(id => !excludes.includes(id))
}

export async function readExtensionConfig(): Promise<ExtensionConfig[]> {
  const extensionsPath = getExtensionsPath()
  if (!extensionsPath) {
    throw new Error('Could not find extensions directory')
  }

  const uri = Uri.file(join(extensionsPath, 'extensions.json'))
  const content = await readFile(uri)
  const config = JSON.parse(content)

  return config
}

export async function getUserExtensions(): Promise<string[]> {
  try {
    // Try to read from the extensions.json file
    const config = await readExtensionConfig()
    return config.map(i => i.identifier.id)
  }
  catch (error) {
    logger.error('Failed to get user extensions', error)
    // That not include the disabled extensions
    return extensions.all
      .filter((ext: Extension<any>) => !ext.packageJSON.isBuiltin)
      .map((ext: Extension<any>) => ext.id)
  }
}

export async function getExtensions(): Promise<string[]> {
  return normalizeExtensions(await getUserExtensions())
}

export async function setExtensions(exts: string[], prompt: boolean = true) {
  const diff = await getExtensionsDiff(exts)
  if (!diff)
    return

  const { toInstall, toDelete } = diff

  if (prompt) {
    const action = await window.showWarningMessage(
      `Sync will:\n• Install ${toInstall.length} extensions\n• Remove ${toDelete.length} extensions\n\nContinue?`,
      { modal: true },
      'Yes',
      'Show Details',
      'Cancel',
    )

    if (action === 'Show Details') {
      const details = [
        toInstall.length > 0 ? `To Install:\n${toInstall.join('\n')}` : '',
        toDelete.length > 0 ? `To Remove:\n${toDelete.join('\n')}` : '',
      ].filter(Boolean).join('\n\n')

      const result = await window.showInformationMessage(
        details,
        { modal: true },
        'Continue',
        'Cancel',
      )

      if (result === 'Cancel') {
        return
      }
    }

    if (action === 'Cancel') {
      return
    }
  }

  let needsReload = false

  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: 'Syncing Extensions',
      cancellable: false,
    },
    async (progress) => {
      const total = toInstall.length + toDelete.length
      let completed = 0

      for (const id of toDelete) {
        try {
          progress.report({
            message: `Uninstalling ${id}...`,
            increment: (++completed / total) * 100,
          })
          await commands.executeCommand(
            'workbench.extensions.uninstallExtension',
            id,
          )
          needsReload = true
          logger.info(`Uninstalled extension: ${id}`)
        }
        catch (error) {
          logger.error(`Failed to uninstall ${id}`, error)
        }
      }

      for (const id of toInstall) {
        try {
          progress.report({
            message: `Installing ${id}...`,
            increment: (++completed / total) * 100,
          })
          await commands.executeCommand(
            'workbench.extensions.installExtension',
            id,
          )
          needsReload = true
          logger.info(`Installed extension: ${id}`)
        }
        catch (error) {
          logger.error(`Failed to install ${id}`, error)
        }
      }
    },
  )

  if (needsReload) {
    const reload = await window.showInformationMessage(
      'Extension sync complete. Reload window to apply all changes?',
      'Reload',
      'Later',
    )
    if (reload === 'Reload') {
      await commands.executeCommand('workbench.action.reloadWindow')
    }
  }
}

export function getExtensionsPath(): string | undefined {
  const ext = extensions.all.find((ext: Extension<any>) => !ext.packageJSON.isBuiltin)
  if (!ext) {
    logger.warn(`Could not find extensions directory`)
    return
  }
  return dirname(ext.extensionPath)
}

export async function getExtensionsDiff(extensions: string[]): Promise<ExtensionsDiff | undefined> {
  extensions = normalizeExtensions(extensions)
  const installedExtensions = normalizeExtensions(await getExtensions())

  const targetSet = new Set(extensions)
  targetSet.add(extensionId)
  const installedSet = new Set(installedExtensions)

  const toInstall = extensions.filter(id => !installedSet.has(id))
  const toDelete = installedExtensions.filter(id => !targetSet.has(id))

  if (toInstall.length === 0 && toDelete.length === 0)
    return

  return { toInstall, toDelete }
}
