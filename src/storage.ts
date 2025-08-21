import { Buffer } from 'node:buffer'
import { Uri, workspace } from 'vscode'
import { config } from './config'
import { logger, resolvePathUri } from './utils'

function getStorageUri(): Uri {
  return resolvePathUri(config.storagePath)
}

export async function ensureStorageDirectory(): Promise<void> {
  const storageUri = getStorageUri()

  try {
    await workspace.fs.stat(storageUri)
  }
  catch {
    await workspace.fs.createDirectory(storageUri)
    logger.info(`Created storage directory: ${storageUri.fsPath}`)
  }
}

export async function storageFileExists(filename: string): Promise<boolean> {
  const storageUri = getStorageUri()
  const fileUri = Uri.joinPath(storageUri, filename)

  try {
    await workspace.fs.stat(fileUri)
    return true
  }
  catch {
    return false
  }
}

export function getStorageFileUri(filename: string): Uri {
  const storageUri = getStorageUri()
  return Uri.joinPath(storageUri, filename)
}

export async function readStorageFile(filename: string): Promise<string> {
  const fileUri = getStorageFileUri(filename)

  try {
    const buffer = await workspace.fs.readFile(fileUri)
    return Buffer.from(buffer).toString('utf-8')
  }
  catch (error) {
    logger.error(`Failed to read storage file: ${filename}`, error)
    throw error
  }
}

export async function writeStorageFile(filename: string, content: string): Promise<void> {
  const storageUri = getStorageUri()
  const fileUri = Uri.joinPath(storageUri, filename)

  try {
    await workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'))
    logger.info(`Storage file updated: ${filename}`)
  }
  catch (error) {
    logger.error(`Failed to write storage file: ${filename}`, error)
    throw error
  }
}
