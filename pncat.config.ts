import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  exclude: ['@types/vscode'],
  catalogRules: mergeCatalogRules([
    {
      name: 'cli',
      match: ['@vscode/vsce', 'ovsx'],
    },
    {
      name: 'utils',
      match: ['comment-json'],
    },
    {
      name: 'vscode',
      match: [/vscode/],
      priority: 50,
    },
  ]),
})
