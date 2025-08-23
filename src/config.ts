import type { AppName } from './types'
import { defineConfigObject } from 'reactive-vscode'
import { env } from 'vscode'
import { EDITOR_CONFIG_NAME_MAP } from './constants'
import * as Meta from './generated/meta'

export const codeName = EDITOR_CONFIG_NAME_MAP[env.appName as AppName]

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)
