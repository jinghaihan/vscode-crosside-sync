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
          "antfu.theme-vitesse",
          "antfu.icons-carbon",
          // enhancements
          "antfu.file-nesting",
          "antfu.pnpm-catalog-lens",
          // linters
          "dbaeumer.vscode-eslint",
          "usernamehw.errorlens",
          "streetsidesoftware.code-spell-checker",
          // intellisense
          "vue.volar",
          "bradlc.vscode-tailwindcss",
          "antfu.unocss",
          "antfu.iconify",
          // git tools
          "eamodio.gitlens",
          "mhutchie.git-graph",
          // misc
          "wmaurer.change-case",
          // sync
          "octohash.crosside-sync"
        ]
      }"
    `)
  })
})
