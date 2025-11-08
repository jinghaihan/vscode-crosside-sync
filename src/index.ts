import type { ExtensionContext } from 'vscode'
import { defineExtension } from 'reactive-vscode'
import { commands } from 'vscode'
import { config } from './config'
import { MetaRecorder } from './recorder'
import { syncExtensions, syncKeybindings, syncProfile, syncSettings } from './sync'
import { ConfigWatcher } from './watcher'

const { activate, deactivate } = defineExtension(async (ctx: ExtensionContext) => {
  const recorder = new MetaRecorder()

  commands.registerCommand('octohash.crosside-sync.syncProfile', () => syncProfile(ctx, recorder, { prompt: false }))
  commands.registerCommand('octohash.crosside-sync.syncSettings', () => syncSettings(ctx, recorder))
  commands.registerCommand('octohash.crosside-sync.syncKeybindings', () => syncKeybindings(ctx, recorder))
  commands.registerCommand('octohash.crosside-sync.syncExtensions', () => syncExtensions(ctx, recorder, { prompt: config.promptOnExtensionSync }))

  if (config.autoSync)
    syncProfile(ctx, recorder, { prompt: config.promptOnAutoSync, silent: !config.promptOnAutoSync })

  const configWatcher = new ConfigWatcher(ctx, recorder)
  await configWatcher.start()

  ctx.subscriptions.push({
    dispose: () => configWatcher.dispose(),
  })
})

export { activate, deactivate }
