import fs from 'fs'
import path from 'path'

export interface FcmTokenEntry {
  token: string
  lang: string
  filter: string
  updatedAt: string
}

const TOKENS_PATH = path.join(process.cwd(), 'data', 'fcm-tokens.json')

export function readTokens(): FcmTokenEntry[] {
  try {
    if (!fs.existsSync(TOKENS_PATH)) return []
    return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'))
  } catch {
    return []
  }
}

export function writeTokens(tokens: FcmTokenEntry[]) {
  const dir = path.dirname(TOKENS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2))
}
