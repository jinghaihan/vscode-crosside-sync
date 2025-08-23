import type { EDITOR_CONFIG_NAME_MAP } from './constants'

export type AppName = keyof typeof EDITOR_CONFIG_NAME_MAP

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
