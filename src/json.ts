import type { CommentArray, CommentObject } from 'comment-json'
import type { ExtensionRecommendations } from './types'
import { parse, stringify } from 'comment-json'

export function jsonParse<T = any>(content: string): T {
  return parse(content, null, true) as unknown as T
}

export function updateExtensionRecommendations(content: string, extensions: string[]) {
  const parsed = parse(content) as CommentObject
  if (!parsed || !parsed.recommendations) {
    throw new Error('Invalid Extensions JSON')
  }

  const config = jsonParse<ExtensionRecommendations>(content)
  const recommendations: string[] = config.recommendations

  const toRemove = recommendations.filter(x => !extensions.includes(x))
  const toAdd = extensions.filter(x => !recommendations.includes(x))

  const recommendationsArray = parsed.recommendations as CommentArray<string>
  toRemove.forEach(x => recommendationsArray.splice(recommendationsArray.indexOf(x), 1))
  recommendationsArray.push(...toAdd)

  return stringify(parsed, null, 2)
}
