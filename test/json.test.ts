import type { ExtensionRecommendations } from '../src/types'
import { parse } from 'comment-json'
import { describe, expect, it } from 'vitest'
import { updateExtensionRecommendations } from '../src/json'
import { readExtensions } from './_utils'

describe('updateExtensionRecommendations', () => {
  it('remove extensions from recommendations', async () => {
    const content = await readExtensions()

    const updated = updateExtensionRecommendations(
      content,
      [
        'file-icons.file-icons',
        'antfu.pnpm-catalog-lens',
        'vue.volar',
      ],
    )

    expect(updated).toMatchInlineSnapshot(`
      "{
        "recommendations": [
          // themes & icons
          "file-icons.file-icons",
          // enhancements
          "antfu.pnpm-catalog-lens",
          // intellisense
          "vue.volar"
        ]
      }"
    `)
  })

  it('add extensions to recommendations', async () => {
    const content = await readExtensions()
    const config = parse(content, null, true) as unknown as ExtensionRecommendations
    const recommendations = config.recommendations

    const updated = updateExtensionRecommendations(
      content,
      [...recommendations, 'octohash.crosside-sync'],
    )

    expect(updated).toMatchInlineSnapshot(`
      "{
        "recommendations": [
          // themes & icons
          "file-icons.file-icons",
          "catppuccin.catppuccin-vsc",
          "catppuccin.catppuccin-vsc-icons",
          "antfu.theme-vitesse",
          "antfu.icons-carbon",
          "be5invis.vscode-custom-css",
          "hoovercj.vscode-power-mode",
          // enhancements
          "antfu.file-nesting",
          "antfu.pnpm-catalog-lens",
          "antfu.goto-alias",
          "antfu.smart-clicks",
          "antfu.where-am-i",
          "gruntfuggly.todo-tree",
          "formulahendry.auto-rename-tag",
          "aaron-bond.better-comments",
          "kamikillerto.vscode-colorize",
          "vunguyentuan.vscode-css-variables",
          // linters
          "dbaeumer.vscode-eslint",
          "esbenp.prettier-vscode",
          "stylelint.vscode-stylelint",
          "usernamehw.errorlens",
          "streetsidesoftware.code-spell-checker",
          // intellisense
          "vue.volar",
          "bradlc.vscode-tailwindcss",
          "antfu.unocss",
          "antfu.iconify",
          "lokalise.i18n-ally",
          // git tools
          "eamodio.gitlens",
          "mhutchie.git-graph",
          // misc
          "wmaurer.change-case",
          "yrm.type-challenges",
          // sync
          "octohash.crosside-sync"
        ]
      }"
    `)
  })
})
