import type { EDITOR_CONFIG_NAME_MAP } from './constants'

export type AppName = keyof typeof EDITOR_CONFIG_NAME_MAP

export type SyncType = 'settings' | 'extensions' | 'keybindings'

export interface SyncCommandOptions {
  prompt?: boolean
  silent?: boolean
}

export interface ExtensionsDiff {
  toInstall: string[]
  toDelete: string[]
}

export interface ExtensionRecommendations {
  recommendations: string[]
}

export interface ExtensionConfig {
  identifier: ExtensionIdentifier
  version: string
  location: ExtensionLocation
  relativeLocation: string
  metadata: ExtensionMetadata
}

export interface ExtensionIdentifier {
  id: string
  uuid: string
}

export interface ExtensionLocation {
  $mid: number
  path: string
  scheme: string
}

export interface ExtensionMetadata {
  installedTimestamp: number
  pinned: boolean
  source: string
  id: string
  publisherId: string
  publisherDisplayName: string
  targetPlatform: string
  updated: boolean
  isPreReleaseVersion: boolean
  hasPreReleaseVersion: boolean
  isApplicationScoped: boolean
  isMachineScoped: boolean
  isBuiltin: boolean
  preRelease: boolean
}

export type SyncMeta = Partial<Record<AppName, Partial<Record<SyncType, number>>>>
