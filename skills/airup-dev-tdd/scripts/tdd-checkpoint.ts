#!/usr/bin/env bun

/**
 * TOON checkpoint protocol for the Airup Dev TDD skill.
 *
 * A checkpoint file is a single TOON tabular document:
 *
 *   tdd[N]{phase,slice,cmd,exit,note}:
 *     start,login-rate-limit,none,0,"用户每分钟最多 5 次登录"
 *     red,login-rate-limit,bun test login.test.ts,1,"429 未生效"
 *
 * `append` adds one validated row and keeps the header count in sync (rows are
 * never rewritten). `validate` checks the ordering rules and exits non-zero on
 * any violation. Both commands are deliberately dependency-free.
 */

import { runLoggedScriptAsync } from '@/shared/script-logger'

const PHASES = ['start', 'red', 'scan', 'green', 'finish'] as const
type Phase = (typeof PHASES)[number]
const FIELDS = ['phase', 'slice', 'cmd', 'exit', 'note'] as const

interface Row {
  phase: Phase
  slice: string
  cmd: string
  exit: number
  note: string
}

/** Quotes a cell when TOON requires it; bare strings otherwise. */
export function encodeCell(value: string): string {
  if (
    value === '' ||
    value === 'true' ||
    value === 'false' ||
    value === 'null' ||
    /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value) ||
    /[\r\n",\\[\]{}:]/.test(value) ||
    value !== value.trim() ||
    value.startsWith('-') ||
    value.startsWith('#')
  ) {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r').replaceAll('\t', '\\t')}"`
  }
  return value
}

export function renderRow(row: Row): string {
  return [encodeCell(row.phase), encodeCell(row.slice), encodeCell(row.cmd), String(row.exit), encodeCell(row.note)].join(',')
}

const HEADER_PATTERN = /^tdd\[(\d+)\]\{phase,slice,cmd,exit,note\}:\s*$/

/** Splits a TOON row into 5 cells with a scanner that honors double-quoted cells. */
export function parseRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  let inQuotes = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (inQuotes) {
      if (char === '\\' && line[index + 1] !== undefined) {
        const escaped = line[index + 1]
        current += escaped === 'n' ? '\n' : escaped === 'r' ? '\r' : escaped === 't' ? '\t' : escaped
        index++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
      quoted = true
    } else if (char === ',') {
      cells.push(quoted ? current : current.trim())
      current = ''
      quoted = false
    } else {
      current += char
    }
  }
  cells.push(quoted ? current : current.trim())
  return cells
}

export function parseCheckpoint(text: string): { headerCount: number; rows: Row[] } {
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  const header = lines.shift()
  if (header === undefined) throw new Error('checkpoint file is empty')
  const headerMatch = header.match(HEADER_PATTERN)
  if (!headerMatch) {
    throw new Error(`header must be "tdd[N]{phase,slice,cmd,exit,note}:" (got: ${header})`)
  }

  const rows: Row[] = []
  for (const line of lines) {
    if (!line.trim()) throw new Error('checkpoint rows must not contain blank lines')
    const cells = parseRow(line)
    if (cells.length !== FIELDS.length) {
      throw new Error(`row must have ${FIELDS.length} comma-separated cells (got ${cells.length}): ${line}`)
    }
    const [phase, slice, cmd, exit, note] = cells
    if (!PHASES.includes(phase as Phase)) {
      throw new Error(`unknown phase "${phase}" (expected one of ${PHASES.join('|')})`)
    }
    if (!slice) throw new Error(`slice is required: ${line}`)
    if (!cmd) throw new Error(`cmd is required (use "none" when not applicable): ${line}`)
    const exitNumber = Number(exit)
    if (!Number.isInteger(exitNumber)) throw new Error(`exit must be an integer (got "${exit}")`)
    rows.push({ phase: phase as Phase, slice, cmd, exit: exitNumber, note })
  }
  const headerCount = Number(headerMatch[1])
  if (headerCount !== rows.length) {
    throw new Error(`header count ${headerCount} does not match ${rows.length} rows`)
  }
  return { headerCount, rows }
}

/** Structural validation independent of tooling: ordering, polarity, closure. */
export function validateRows(rows: Row[]): string[] {
  const violations: string[] = []
  if (rows.length === 0) return ['checkpoint has no rows']
  if (rows[0]?.phase !== 'start') violations.push('first row must be a start row')
  const startCount = rows.filter((row) => row.phase === 'start').length
  if (startCount !== 1) violations.push(`expected exactly 1 start row (got ${startCount})`)

  const redIndexes = new Map<string, number>()
  for (const [index, row] of rows.entries()) {
    const label = `row ${index + 1} (${row.phase},${row.slice})`
    if (row.phase === 'red') {
      if (row.exit === 0) violations.push(`${label}: red exit must be non-zero`)
      redIndexes.set(row.slice, index)
    }
    if (row.phase === 'green') {
      if (row.exit !== 0) violations.push(`${label}: green exit must be 0`)
      const red = redIndexes.get(row.slice)
      if (red === undefined) violations.push(`${label}: green without a preceding red for slice "${row.slice}"`)
    }
    if (row.phase === 'start' && index !== 0) violations.push(`${label}: start must be the first row`)
    if (row.phase === 'finish' && index !== rows.length - 1) {
      violations.push(`${label}: finish must be the last row`)
    }
    if (row.phase === 'scan') {
      const red = redIndexes.get(row.slice)
      if (red === undefined) violations.push(`${label}: scan without a preceding red for slice "${row.slice}"`)
    }
  }

  const finish = rows[rows.length - 1]
  if (finish.phase === 'finish') {
    const lastRed = [...redIndexes.entries()].findLast(([, index]) => index < rows.length - 1)
    const hasGreenAfterLastRed = rows.some((row, index) => row.phase === 'green' && lastRed !== undefined && row.slice === lastRed[0] && index > lastRed[1])
    if (lastRed && !hasGreenAfterLastRed) {
      violations.push(`finish requires the last red slice "${lastRed[0]}" to reach green`)
    }
  }
  return violations
}

interface AppendOptions {
  phase: Phase
  slice: string
  cmd: string
  exit: number
  note: string
}

/**
 * Appends one row and rewrites only the header count so the file stays valid
 * TOON. Row bytes are never modified.
 */
export function appendRow(previous: string | undefined, options: AppendOptions): string {
  const row = renderRow(options)
  if (!previous?.trim()) {
    return `tdd[1]{phase,slice,cmd,exit,note}:\n  ${row}\n`
  }
  const { rows } = parseCheckpoint(previous)
  const validation = validateRows(rows)
  if (validation.length > 0) throw new Error(`checkpoint is invalid; refusing to append: ${validation.join('; ')}`)
  if (rows.some((existing) => existing.phase === 'finish')) {
    throw new Error('checkpoint already has a finish row; start a new checkpoint file for the next task')
  }
  const lines = previous.replaceAll('\r\n', '\n').split('\n')
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  lines[0] = `tdd[${rows.length + 1}]{phase,slice,cmd,exit,note}:`
  return `${lines.join('\n')}\n  ${row}\n`
}

function readOption(name: string): string | undefined {
  const index = Bun.argv.indexOf(name)
  return index < 0 ? undefined : Bun.argv[index + 1]
}

function usage(): string {
  return [
    'Usage:',
    '  tdd-checkpoint.ts append --checkpoint <file.toon> --phase <start|red|scan|green|finish> --slice <slug> --cmd <command|none> --exit <code> --note <text>',
    '  tdd-checkpoint.ts validate --checkpoint <file.toon>',
  ].join('\n')
}

async function main(): Promise<number> {
  const command = readOption('append') !== undefined ? 'append' : readOption('validate') !== undefined ? 'validate' : undefined
  const checkpoint = readOption('--checkpoint')
  if (!command || !checkpoint) {
    console.error(usage())
    return 1
  }

  if (command === 'validate') {
    const text = await Bun.file(checkpoint).text()
    const { rows } = parseCheckpoint(text)
    const violations = validateRows(rows)
    if (violations.length > 0) {
      for (const violation of violations) console.error(`ERROR: ${violation}`)
      return 1
    }
    console.log(`OK: ${rows.length} rows valid`)
    return 0
  }

  const phase = readOption('--phase') as Phase | undefined
  const slice = readOption('--slice')
  const cmd = readOption('--cmd')
  const exit = Number(readOption('--exit'))
  const note = readOption('--note') ?? 'none'
  if (!phase || !PHASES.includes(phase) || !slice || !cmd || !Number.isInteger(exit)) {
    console.error(usage())
    return 1
  }
  const file = Bun.file(checkpoint)
  const previous = (await file.exists()) ? await file.text() : undefined
  const content = appendRow(previous, { phase, slice, cmd, exit, note })
  const { mkdir } = await import('node:fs/promises')
  await mkdir(checkpoint.replaceAll('\\', '/').split('/').slice(0, -1).join('/'), { recursive: true })
  await Bun.write(checkpoint, content)
  console.log(`appended ${phase} row for slice ${slice}`)
  return 0
}

// Stryker disable next-line ConditionalExpression -- import.meta.main is an untestable runtime loader boundary
if (import.meta.main) {
  process.exit(await runLoggedScriptAsync({ scriptName: 'tdd-checkpoint' }, () => main()))
}
