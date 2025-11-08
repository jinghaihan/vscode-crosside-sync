import type { AppName, SyncMeta, SyncType } from './types'
import { env, Uri, workspace } from 'vscode'
import { DEFAULT_SYNC_META } from './constants'
import { jsonParse } from './json'
import { getStorageFileUri, readStorageFile, storageFileExists, writeStorageFile } from './storage'
import { compareFsMtime, logger } from './utils'

export class MetaRecorder {
  private filename = 'crosside-sync.json'
  private appName: AppName

  constructor() {
    this.appName = env.appName as AppName
    this.ensure()
  }

  getAppName() {
    return this.appName
  }

  getPath(key: SyncType) {
    switch (key) {
      case 'settings':
        return getStorageFileUri('settings.json')
      case 'extensions':
        return getStorageFileUri('extensions.json')
      case 'keybindings':
        return getStorageFileUri('keybindings.json')
    }
  }

  private async ensure() {
    const hasStorage = await storageFileExists(this.filename)
    if (!hasStorage)
      await writeStorageFile(this.filename, JSON.stringify(DEFAULT_SYNC_META, null, 2))
  }

  private async read() {
    await this.ensure()
    const content = await readStorageFile(this.filename)
    return jsonParse<SyncMeta>(content)
  }

  private async write(meta: SyncMeta) {
    const sortedMeta = Object.keys(meta).sort().reduce((acc, key) => {
      acc[key as AppName] = meta[key as AppName]
      return acc
    }, {} as SyncMeta)
    await writeStorageFile(this.filename, JSON.stringify(sortedMeta, null, 2))
  }

  async getStorageMtime(key: SyncType) {
    const path = this.getPath(key)
    const state = await workspace.fs.stat(Uri.file(path.fsPath))
    return state.mtime
  }

  async getMtime(time: SyncType, app: AppName = this.appName) {
    const meta = await this.read()
    return meta[app]?.[time]
  }

  async updateMtime(time: SyncType, app: AppName = this.appName, mtime: number = new Date().getTime()) {
    const meta = await this.read()
    meta[app] = {
      ...meta[app],
      [time]: mtime,
    }
    await this.write(meta)
  }

  async compareMtime(time: SyncType, storagePath: string, appPath: string) {
    try {
      const mtime1 = await this.getStorageMtime(time)
      const mtime2 = await this.getMtime(time, this.appName)

      logger.info(`compare ${time} mtime: storage - ${mtime1} app - ${mtime2}`)

      // when no mtime is recorded, consider storage is newer
      if (!mtime1 || !mtime2) {
        await this.updateMtime(time)
        return 1
      }
      if (mtime1 > mtime2)
        return 1 // storage is newer
      else if (mtime1 < mtime2)
        return -1 // app is newer
      else
        return 0 // same modification time
    }
    catch (error) {
      logger.error(`Failed to compare ${time} mtime`, error)
      return await compareFsMtime(storagePath, appPath)
    }
  }
}
