import type { ExtensionQueryResponse } from './types'
import { Buffer } from 'node:buffer'
import { ofetch } from 'ofetch'
import { Uri, workspace } from 'vscode'
import { getStorageUri } from './storage'

async function getVsixPackage(id: string): Promise<string> {
  const data = await ofetch<ExtensionQueryResponse>(
    'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json;api-version=7.1-preview.1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetTypes: ['Microsoft.VisualStudio.Services.VSIXPackage'],
        filters: [
          {
            criteria: [
              { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
              { filterType: 10, value: id },
              { filterType: 12, value: '37888' },
            ],
            pageNumber: 1,
            pageSize: 1,
            sortBy: 0,
            sortOrder: 0,
          },
        ],
        flags: 914,
      }),
    },
  )
  const ext = data?.results?.[0]?.extensions?.[0]
  const version = ext.versions?.[0]
  const pkg = version.files?.find(f => f.assetType.includes('VSIXPackage'))
  if (!pkg)
    throw new Error(`No VSIXPackage found for extension ${id}`)
  return pkg.source
}

export async function downloadVsixPackage(id: string): Promise<Uri> {
  const url = await getVsixPackage(id)
  const res = await ofetch(url, {
    responseType: 'arrayBuffer',
  })
  const uri = Uri.joinPath(getStorageUri(), id.endsWith('.vsix') ? id : `${id}.vsix`)
  await workspace.fs.writeFile(uri, Buffer.from(res))
  return uri
}
