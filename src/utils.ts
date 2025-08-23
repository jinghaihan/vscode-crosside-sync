import type { Extension } from 'vscode'
import { homedir, platform } from 'node:os'
import { dirname } from 'node:path'
import process from 'node:process'
import { useLogger } from 'reactive-vscode'
import { extensions, Uri, workspace } from 'vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

function getConfigPaths(codeName: string, file: string): string[] {
  switch (platform()) {
    case 'win32':
      return [
        `${process.env.APPDATA}/${codeName}/User/${file}`,
        `${process.env.USERPROFILE}/AppData/Roaming/${codeName}/User/${file}`,
      ]
    case 'darwin':
      return [
        `${process.env.HOME}/Library/Application Support/${codeName}/User/${file}`,
        `${homedir()}/Library/Application Support/${codeName}/User/${file}`,
      ]
    default:
      return [
        `${process.env.HOME}/.config/${codeName}/User/${file}`,
        `${process.env.XDG_CONFIG_HOME || `${homedir()}/.config`}/${codeName}/User/${file}`,
        `${homedir()}/.config/${codeName}/User/${file}`,
      ]
  }
}

export async function findConfigFile(codeName: string, file: string): Promise<string | undefined> {
  const possiblePaths = getConfigPaths(codeName, file)

  for (const path of possiblePaths) {
    try {
      await workspace.fs.stat(Uri.file(path))
      logger.info(`Found ${file} at: ${path}`)
      return path
    }
    catch {
      continue
    }
  }
  logger.warn(`Could not find ${file} in any default location`)
  return undefined
}

export function resolvePathUri(path: string): Uri {
  if (path.startsWith('~')) {
    return Uri.file(path.replace('~', homedir()))
  }
  return Uri.file(path)
}

export async function compareMtime(path1: string, path2: string): Promise<1 | -1 | 0 | undefined> {
  try {
    const [stat1, stat2] = await Promise.all([
      workspace.fs.stat(Uri.file(path1)),
      workspace.fs.stat(Uri.file(path2)),
    ])

    const mtime1 = stat1.mtime
    const mtime2 = stat2.mtime

    if (mtime1 > mtime2)
      return 1 // path1 is newer
    else if (mtime1 < mtime2)
      return -1 // path2 is newer
    else
      return 0 // same modification time
  }
  catch (error) {
    logger.warn(`Failed to compare file modification times: ${error}`)
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
