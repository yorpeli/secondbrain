import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const ASSETS = join(__dirname, 'assets')

function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true })
}

function copyIfMissing(src: string, dest: string): 'copied' | 'kept' {
  if (existsSync(dest)) return 'kept'
  copyFileSync(src, dest)
  return 'copied'
}

export function scaffold(): void {
  ensureDir(join(CC, 'context'))
  ensureDir(join(CC, 'templates'))
  ensureDir(join(CC, 'daily'))

  const t = copyIfMissing(
    join(ASSETS, 'dashboard.template.html'),
    join(CC, 'templates', 'dashboard.template.html')
  )
  const r = copyIfMissing(
    join(ASSETS, 'routing.starter.md'),
    join(CC, 'context', 'routing.md')
  )

  console.log(`command-center scaffolded at ${CC}`)
  console.log(`  templates/dashboard.template.html: ${t}`)
  console.log(`  context/routing.md: ${r}`)
}

scaffold()
