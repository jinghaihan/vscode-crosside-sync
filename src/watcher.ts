import type { ExtensionContext, FileSystemWatcher, Uri } from 'vscode'
import type { MetaRecorder } from './recorder'
import { extensions, workspace } from 'vscode'
import { codeName } from './config'
import { updateExtensionRecommendations } from './json'
import { getExtensions, getKeybindings, getSettings } from './profile'
import { readStorageFile, storageFileExists, writeStorageFile } from './storage'
import { findConfigFile, logger } from './utils'

export class ConfigWatcher {
  private ctx: ExtensionContext
  private recorder: MetaRecorder
  private keybindingsWatcher?: FileSystemWatcher
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(ctx: ExtensionContext, recorder: MetaRecorder) {
    this.ctx = ctx
    this.recorder = recorder
  }

  async start() {
    this.watchSettings()
    this.watchExtensions()
    await this.watchKeybindings()

    logger.info('Config watcher started')
  }

  dispose() {
    this.keybindingsWatcher?.dispose()

    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()

    logger.info('Config watcher disposed')
  }

  private watchSettings() {
    const configChangeDisposable = workspace.onDidChangeConfiguration(() => {
      this.debounceSync('settings', async () => {
        try {
          logger.info('Settings configuration changed, syncing to storage...')
          const settingsPath = await findConfigFile(codeName, 'settings.json')
          if (settingsPath) {
            const hasStorage = await storageFileExists('settings.json')
            if (hasStorage) {
              const storageMtime = await this.recorder.getStorageMtime('settings')
              if (storageMtime > new Date().getTime())
                return
            }

            const settings = await getSettings(settingsPath)
            await writeStorageFile('settings.json', settings)
            await this.recorder.updateMtime('settings')
          }
        }
        catch (error) {
          logger.error('Failed to sync settings to storage', error)
        }
      })
    })

    this.ctx.subscriptions.push(configChangeDisposable)
  }

  private watchExtensions() {
    const extensionsChangeDisposable = extensions.onDidChange(() => {
      this.debounceSync('extensions', async () => {
        try {
          logger.info('Extensions changed, syncing to storage...')
          const extensions = await getExtensions()
          const hasStorage = await storageFileExists('extensions.json')

          if (!hasStorage) {
            await writeStorageFile('extensions.json', JSON.stringify({ recommendations: extensions }, null, 2))
          }
          else {
            const storageExtensions = await readStorageFile('extensions.json')
            const content = updateExtensionRecommendations(storageExtensions, extensions)
            await writeStorageFile('extensions.json', content)
          }
          await this.recorder.updateMtime('extensions')

          logger.info('Extensions synced to storage successfully')
        }
        catch (error) {
          logger.error('Failed to sync extensions to storage', error)
        }
      })
    })

    this.ctx.subscriptions.push(extensionsChangeDisposable)
  }

  private async watchKeybindings() {
    const keybindingsPath = await findConfigFile(codeName, 'keybindings.json')
    if (!keybindingsPath) {
      logger.warn('Keybindings file not found, skipping watcher')
      return
    }

    this.keybindingsWatcher = workspace.createFileSystemWatcher(keybindingsPath)

    this.keybindingsWatcher.onDidChange(async (_uri: Uri) => {
      this.debounceSync('keybindings', async () => {
        try {
          logger.info('Keybindings file changed, syncing to storage...')
          const keybindings = await getKeybindings(keybindingsPath)
          await writeStorageFile('keybindings.json', keybindings)
          await this.recorder.updateMtime('keybindings')
          logger.info('Keybindings synced to storage successfully')
        }
        catch (error) {
          logger.error('Failed to sync keybindings to storage', error)
        }
      })
    })

    this.ctx.subscriptions.push(this.keybindingsWatcher)
  }

  private debounceSync(key: string, syncFn: () => Promise<void>, delay = 500) {
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(async () => {
      await syncFn()
      this.debounceTimers.delete(key)
    }, delay)

    this.debounceTimers.set(key, timer)
  }
}
