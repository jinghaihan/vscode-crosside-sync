import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function readExtensions(): Promise<string> {
  return await readFile(join('test', 'fixtures', 'extensions.json'), 'utf-8')
}
