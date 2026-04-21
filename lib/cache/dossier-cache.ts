import { createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Dossier } from '@/lib/analysis/types'

const CACHE_DIR = join(process.cwd(), 'lib', 'cache', 'dossiers')

function cacheKey(subject: string, thesis: string): string {
  return createHash('sha256').update(subject + thesis).digest('hex').slice(0, 16)
}

export function readDossierCache(subject: string, thesis: string): Dossier | null {
  if (process.env.USE_DOSSIER_CACHE !== 'true') return null
  const path = join(CACHE_DIR, `${cacheKey(subject, thesis)}.json`)
  if (!existsSync(path)) return null
  try {
    console.log(`using cached dossier for ${subject}`)
    return JSON.parse(readFileSync(path, 'utf-8')) as Dossier
  } catch {
    return null
  }
}

export function writeDossierCache(subject: string, thesis: string, dossier: Dossier): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    const path = join(CACHE_DIR, `${cacheKey(subject, thesis)}.json`)
    writeFileSync(path, JSON.stringify(dossier, null, 2))
  } catch {
    // Non-fatal
  }
}
