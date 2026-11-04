import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendRow, encodeCell, parseCheckpoint, parseRow, renderRow, validateRows } from './tdd-checkpoint'

const VALID = [
  'start,transfer-duplicate,none,0,"拒绝重复转账请求"',
  'red,transfer-duplicate,bun test transfer.test.ts,1,"重复请求被接受"',
  'scan,transfer-duplicate,none,0,"next: 并发提交; deferred: 幂等过期"',
  'green,transfer-duplicate,bun test transfer.test.ts,0,"重复请求被拒绝"',
  'finish,transfer-duplicate,bun run lint,0,none',
]

const toText = (rows: string[]) => `tdd[${rows.length}]{phase,slice,cmd,exit,note}:\n  ${rows.join('\n  ')}\n`

describe('tdd-checkpoint format', () => {
  it('quotes only cells that TOON requires', () => {
    expect(encodeCell('plain')).toBe('plain')
    expect(encodeCell('has,comma')).toBe('"has,comma"')
    expect(encodeCell('has:colon')).toBe('"has:colon"')
    expect(encodeCell('42')).toBe('"42"')
    expect(encodeCell('')).toBe('""')
    expect(encodeCell(' padded ')).toBe('" padded "')
    expect(encodeCell('say "hi"')).toBe('"say \\"hi\\""')
  })

  it('round-trips rows through encode and parse', () => {
    const row = 'red,login,bun test,1,"429 未生效"'
    expect(parseRow(renderRow({ phase: 'red', slice: 'login', cmd: 'bun test', exit: 1, note: '429 未生效' }))).toEqual([
      'red',
      'login',
      'bun test',
      '1',
      '429 未生效',
    ])
    expect(parseRow(row)[4]).toBe('429 未生效')
  })
})

describe('parseCheckpoint', () => {
  it('accepts a valid checkpoint', () => {
    const { headerCount, rows } = parseCheckpoint(toText(VALID))
    expect(headerCount).toBe(5)
    expect(rows).toHaveLength(5)
    expect(rows[0].phase).toBe('start')
    expect(rows[2].note).toBe('next: 并发提交; deferred: 幂等过期')
  })

  it('rejects header count mismatch, bad phase, and wrong cell count', () => {
    expect(() => parseCheckpoint(toText(VALID).replace('tdd[5]', 'tdd[4]'))).toThrow(/does not match/)
    expect(() => parseCheckpoint(toText(['start,a,none,0,x', 'pause,a,none,0,x']))).toThrow(/unknown phase/)
    expect(() => parseCheckpoint(toText(['start,a,none,0']))).toThrow(/cells/)
    expect(() => parseCheckpoint('start,a,none,0,x\n')).toThrow(/header/)
  })
})

describe('validateRows', () => {
  it('accepts the canonical sequence', () => {
    expect(validateRows(parseCheckpoint(toText(VALID)).rows)).toEqual([])
  })

  it('enforces start-first, red-before-green, exit polarity, and finish placement', () => {
    expect(validateRows(parseCheckpoint(toText(['red,a,bun test,1,x'])).rows).join('; ')).toMatch(/first row must be a start/)
    expect(validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'green,a,bun test,0,x'])).rows).join('; ')).toMatch(/green without a preceding red/)
    expect(validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'red,a,bun test,0,x'])).rows).join('; ')).toMatch(/red exit must be non-zero/)
    expect(validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'red,a,bun test,1,x', 'green,a,bun test,1,x'])).rows).join('; ')).toMatch(
      /green exit must be 0/,
    )
    expect(
      validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'red,a,bun test,1,x', 'finish,a,bun lint,0,none', 'green,a,bun test,0,x'])).rows).join('; '),
    ).toMatch(/finish must be the last row/)
    expect(validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'red,a,bun test,1,x', 'finish,a,bun lint,0,none'])).rows).join('; ')).toMatch(
      /finish requires the last red slice/,
    )
    expect(validateRows(parseCheckpoint(toText(['start,a,none,0,x', 'start,a,none,0,x'])).rows).join('; ')).toMatch(/exactly 1 start row/)
  })
})

describe('appendRow', () => {
  it('creates the header on first append and keeps the count in sync', () => {
    const first = appendRow(undefined, { phase: 'start', slice: 'a', cmd: 'none', exit: 0, note: '范围' })
    expect(first).toBe('tdd[1]{phase,slice,cmd,exit,note}:\n  start,a,none,0,范围\n')
    const second = appendRow(first, { phase: 'red', slice: 'a', cmd: 'bun test', exit: 1, note: '未实现' })
    const { headerCount, rows } = parseCheckpoint(second)
    expect(headerCount).toBe(2)
    expect(rows.map((row) => row.phase)).toEqual(['start', 'red'])
  })

  it('refuses to append to a finished or invalid checkpoint', () => {
    expect(() => appendRow(toText(VALID), { phase: 'scan', slice: 'a', cmd: 'none', exit: 0, note: 'x' })).toThrow(/finish row/)
    expect(() => appendRow(toText(['red,a,bun test,1,x']), { phase: 'red', slice: 'a', cmd: 'none', exit: 0, note: 'x' })).toThrow(/invalid/)
  })
})

describe('cli', () => {
  const SCRIPT = join(import.meta.dir, 'tdd-checkpoint.ts')

  it('appends via cli and validates the result', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tdd-checkpoint-'))
    try {
      const file = join(dir, 'task.toon')
      const append = (phase: string, exit: string) =>
        Bun.spawnSync([
          'bun',
          SCRIPT,
          'append',
          '--checkpoint',
          file,
          '--phase',
          phase,
          '--slice',
          'login',
          '--cmd',
          'bun test',
          '--exit',
          exit,
          '--note',
          'evidence',
        ])
      append('start', '0')
      append('red', '1')
      append('green', '0')
      append('finish', '0')
      const validate = Bun.spawnSync(['bun', SCRIPT, 'validate', '--checkpoint', file])
      expect(validate.exitCode).toBe(0)
      expect(validate.stdout.toString()).toMatch(/OK: 4 rows valid/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
