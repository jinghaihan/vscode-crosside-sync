export interface SyncCommandOptions {
  prompt?: boolean
  silent?: boolean
}

export interface ExtensionDiff {
  toInstall: string[]
  toDelete: string[]
}

export interface ExtensionRecommendations {
  recommendations: string[]
}
