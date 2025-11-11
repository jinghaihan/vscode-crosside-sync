import type { Extension } from 'vscode'
import type { ExtensionConfig, ExtensionsDiff } from './types'
import { Buffer } from 'node:buffer'
import { dirname, join } from 'node:path'
import { commands, extensions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { config } from './config'
import { downloadVsixPackage } from './downloader'
import { displayName, extensionId } from './generated/meta'
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

function formatMessage(title: string, extensions?: string[]): string {
  const parts = [displayName, title]
  if (extensions && extensions.length > 0) {
    parts.push(...extensions.map(ext => `• ${ext}`))
  }
  return parts.join('\n')
}

export async function readExtensionConfig(): Promise<ExtensionConfig[]> {
  const extensionsPath = getExtensionsPath()
  if (!extensionsPath)
    throw new Error('Could not find extensions directory')

  const uri = Uri.file(join(extensionsPath, 'extensions.json'))
  const content = await readFile(uri)
  const config = JSON.parse(content)

  return config
}

export async function getUserExtensions(): Promise<string[]> {
  try {
    // Try to read from the extensions.json file
    const config = await readExtensionConfig()
    const extensions = config.map(i => i.identifier.id)
    logger.info(`User extensions: \n${extensions.join('\n')}`)
    return extensions
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
      formatMessage(
        `• ${toInstall.length} extension${toInstall.length !== 1 ? 's' : ''} to install\n• ${toDelete.length} extension${toDelete.length !== 1 ? 's' : ''} to remove`,
      ),
      { modal: true },
      'Apply Changes',
      'Review Details',
    )

    if (action === 'Review Details') {
      const details: string[] = [displayName]
      if (toInstall.length > 0)
        details.push('Installing:', ...toInstall.map(ext => `• ${ext}`))
      if (toDelete.length > 0) {
        if (details.length > 0)
          details.push('')
        details.push('Removing:', ...toDelete.map(ext => `• ${ext}`))
      }

      const result = await window.showInformationMessage(
        details.join('\n'),
        { modal: true },
        'Continue',
      )

      if (result !== 'Continue')
        return
    }
    else if (action === 'Apply Changes') {
      // do nothing
    }
    else {
      return
    }
  }

  let needsReload: boolean = false
  const failedToInstall: string[] = []

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
          await commands.executeCommand('workbench.extensions.installExtension', id)
          needsReload = true
          logger.info(`Installed extension: ${id}`)
        }
        catch (error) {
          failedToInstall.push(id)
          logger.error(`Failed to install ${id}`, error)
        }
      }
    },
  )

  if (failedToInstall.length > 0) {
    const result = await window.showWarningMessage(
      formatMessage('Failed to install:', failedToInstall),
      { modal: true },
      'Install from Marketplace',
    )

    if (result === 'Install from Marketplace')
      needsReload = await installExtensionFromMarketplace(failedToInstall)
  }

  if (needsReload) {
    const reload = await window.showInformationMessage(
      formatMessage('Extension sync complete. Reload window to apply all changes?'),
      'Reload',
      'Later',
    )
    if (reload === 'Reload')
      await commands.executeCommand('workbench.action.reloadWindow')
  }
}

export async function installExtensionFromMarketplace(ids: string[]) {
  let needsReload: boolean = false
  const failedToInstall: string[] = []

  await window.withProgress({
    location: ProgressLocation.Notification,
    title: 'Installing Extensions',
    cancellable: false,
  }, async (progress) => {
    const total = ids.length
    let completed = 0

    for (const id of ids) {
      try {
        progress.report({
          message: `Installing ${id}...`,
          increment: (++completed / total) * 100,
        })
        const uri = await downloadVsixPackage(id)
        try {
          await commands.executeCommand('workbench.extensions.installExtension', uri)
        }
        finally {
          await workspace.fs.delete(uri, { useTrash: false })
        }
        needsReload = true
      }
      catch (error) {
        failedToInstall.push(id)
        logger.error(`Failed to install ${id} from VS Code Marketplace`, error)
        continue
      }
    }
  })

  if (failedToInstall.length > 0)
    window.showErrorMessage(formatMessage('Failed to install:', failedToInstall), { modal: true })

  return needsReload
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
