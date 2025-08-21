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
