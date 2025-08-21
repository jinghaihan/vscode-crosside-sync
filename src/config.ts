import { defineConfigObject } from 'reactive-vscode'
import { env } from 'vscode'
import * as Meta from './generated/meta'

export const appName = env.appName.includes('Code') ? 'Code' : 'Cursor'

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)
