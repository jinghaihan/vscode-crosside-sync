import type { ExtensionContext } from 'vscode'
import { defineExtension } from 'reactive-vscode'
import { commands } from 'vscode'
import { config } from './config'
import { syncExtensions, syncKeybindings, syncProfile, syncSettings } from './sync'
import { ConfigWatcher } from './watcher'

const { activate, deactivate } = defineExtension(async (ctx: ExtensionContext) => {
  commands.registerCommand('octohash.crosside-sync.syncProfile', () => syncProfile(ctx, { prompt: false }))
  commands.registerCommand('octohash.crosside-sync.syncSettings', () => syncSettings(ctx))
  commands.registerCommand('octohash.crosside-sync.syncKeybindings', () => syncKeybindings(ctx))
  commands.registerCommand('octohash.crosside-sync.syncExtensions', () => syncExtensions(ctx, { prompt: config.promptOnExtensionSync }))

  if (config.autoSync) {
    syncProfile(ctx, { prompt: config.promptOnAutoSync })
  }

  const configWatcher = new ConfigWatcher(ctx)
  await configWatcher.start()

  ctx.subscriptions.push({
    dispose: () => configWatcher.dispose(),
  })
})

export { activate, deactivate }
