import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

export type Finding = {
  ecosystem: string
  file: string
  dependency: string
  type: string
  evidence: string
  risk: 'blocking' | 'suggestion'
  action: string
  autoFixable: boolean
}

export type Options = {
  root: string
  fix: boolean
  dryRun: boolean
  format: 'text' | 'json' | 'toon'
}

export function parseOptions(argv: string[]): Options {
  let root = process.cwd()
  let format: Options['format'] = 'text'
  let fix = false
  let dryRun = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const next = argv[index + 1]
    if (argument === '--path') root = next ?? root
    if (argument === '--format' && (next === 'json' || next === 'toon')) format = next
    if (argument === '--fix') fix = true
    if (argument === '--dry-run') dryRun = true
  }
  return { root, fix, dryRun, format }
}

const TOON_FIELDS = ['ecosystem', 'file', 'dependency', 'type', 'evidence', 'risk', 'action', 'autoFixable'] as const

const TOON_ESCAPES: Record<string, string> = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' }

function toonCell(value: string | boolean): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  const requiresQuote =
    value === '' ||
    /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(value) ||
    /^(true|false|null)$/i.test(value) ||
    /[,:[\]\n\r\t"]/.test(value) ||
    /^\s|\s$/.test(value)
  if (!requiresQuote) return value
  return `"${value.replaceAll(/[\\"\n\r\t]/g, (character) => TOON_ESCAPES[character] ?? character)}"`
}

export function toToon(findings: Finding[]): string {
  if (!findings.length) return 'findings[0]:'
  const header = `findings[${findings.length}]{${TOON_FIELDS.join(',')}}:`
  const rows = findings.map((finding) => `  ${TOON_FIELDS.map((field) => toonCell(finding[field])).join(',')}`)
  return [header, ...rows].join('\n')
}

export function emit(findings: Finding[], format: Options['format']): number {
  if (format === 'json') console.log(JSON.stringify(findings, null, 2))
  else if (format === 'toon') console.log(toToon(findings))
  else if (!findings.length) console.log('dependency check passed')
  else
    for (const finding of findings)
      console.log(`${finding.risk.toUpperCase()} ${finding.ecosystem} ${finding.file}: ${finding.dependency} - ${finding.evidence}. ${finding.action}`)
  return findings.some((finding) => finding.risk === 'blocking') ? 1 : 0
}

export function readText(root: string, file: string): string {
  const path = join(root, file)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

export function displayPath(root: string, file: string): string {
  return relative(root, join(root, file)).replaceAll('\\', '/')
}

export function dependencyFinding(input: Omit<Finding, 'risk'> & { risk?: Finding['risk'] }): Finding {
  return { ...input, risk: input.risk ?? 'blocking' }
}

export function runTool(command: string, args: string[], cwd: string): { available: boolean; exitCode: number } {
  try {
    const result = Bun.spawnSync([command, ...args], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    return { available: true, exitCode: result.exitCode }
  } catch {
    return { available: false, exitCode: 2 }
  }
}
