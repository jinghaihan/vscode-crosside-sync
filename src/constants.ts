import type { SyncMeta } from './types'

export const EDITOR_CONFIG_NAME_MAP = {
  'Visual Studio Code': 'Code',
  'Visual Studio Code - Insiders': 'Code - Insiders',
  'VSCodium': 'VSCodium',
  'VSCodium - Insiders': 'VSCodium - Insiders',
  'Cursor': 'Cursor',
  'Windsurf': 'Windsurf',
} as const

export const DEFAULT_SYNC_META: SyncMeta = {}
