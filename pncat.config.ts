import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  exclude: ['@types/vscode'],
  catalogRules: mergeCatalogRules([
    {
      name: 'utils',
      match: ['comment-json'],
    },
  ]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
})
