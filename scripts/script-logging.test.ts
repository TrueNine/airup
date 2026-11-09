import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createScriptLogger, resolvePluginRoot, runLoggedScript, runLoggedScriptAsync, SESSION_ENV_NAMES } from '@/shared/script-logger'

interface LogEntry {
  timestamp: string
  level: string
  event: string
  script: string
  sessionId: string
  message?: string
  exitCode?: number
  stream?: string
  hookEvent?: string
  toolName?: string
  cwd?: string
  custom?: string
}

const tempDirs: string[] = []
const repositoryRoot = join(import.meta.dir, '..')
const operationalScriptPaths = [
  'scripts/check-skill-metadata.ts',
  'hooks/pre-tool-use/prevent-git-github-operations.ts',
  'hooks/subagent/prevent-main-agent-write.ts',
  'hooks/session-start/prevent-protected-branch-push.ts',
  'skills/airup-codex-assets/scripts/airup-codex-assets.ts',
  'skills/airup-codex-assets/scripts/trust-codex-hooks.ts',
  'skills/airup-ddd-event-storming-design/scripts/validate-ddd-design.ts',
  'skills/airup-dev-tdd/scripts/tdd-checkpoint.ts',
  'skills/airup-iam-access-control-design/scripts/validate-authorization-identifiers.ts',
] as const

function createPluginRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'airup-script-logging-'))
  tempDirs.push(root)
  return root
}

function logFiles(pluginRoot: string): string[] {
  return readdirSync(join(pluginRoot, '.logs')).sort()
}

function logEntries(pluginRoot: string, fileName: string): LogEntry[] {
  return readFileSync(join(pluginRoot, '.logs', fileName), 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as LogEntry)
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

describe('script session logging', () => {
  it('derives a per-session log file under the plugin root', () => {
    const pluginRoot = createPluginRoot()

    const exitCode = runLoggedScript(
      {
        pluginRoot,
        scriptName: 'example-script',
        sessionId: 'session-abc',
        now: new Date(2026, 6, 16, 9, 5, 30),
      },
      () => 0,
    )

    expect(exitCode).toBe(0)
    expect(logFiles(pluginRoot)).toEqual(['session-abc.log'])
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toMatchObject([
      {
        level: 'info',
        event: 'script.start',
        script: 'example-script',
        sessionId: 'session-abc',
      },
      {
        level: 'info',
        event: 'script.finish',
        script: 'example-script',
        sessionId: 'session-abc',
        exitCode: 0,
      },
    ])
  })

  it('appends later executions from the same session to its first log file', () => {
    const pluginRoot = createPluginRoot()

    runLoggedScript(
      {
        pluginRoot,
        scriptName: 'first-script',
        sessionId: 'same-session',
        now: new Date(2026, 6, 16, 9, 5),
      },
      () => 0,
    )
    runLoggedScript(
      {
        pluginRoot,
        scriptName: 'second-script',
        sessionId: 'same-session',
        now: new Date(2026, 6, 16, 10, 45),
      },
      () => 2,
    )

    expect(logFiles(pluginRoot)).toEqual(['same-session.log'])
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0]).map((entry) => `${entry.script}:${entry.event}:${entry.exitCode ?? ''}`)).toEqual([
      'first-script:script.start:',
      'first-script:script.finish:0',
      'second-script:script.start:',
      'second-script:script.finish:2',
    ])
  })

  it('uses payload sessionId and keeps different sessions separate', () => {
    const pluginRoot = createPluginRoot()

    runLoggedScript(
      {
        pluginRoot,
        scriptName: 'snake-session',
        payload: { session_id: 'session-one' },
        now: new Date(2026, 6, 16, 9, 5),
      },
      () => 0,
    )
    runLoggedScript(
      {
        pluginRoot,
        scriptName: 'camel-session',
        payload: { sessionId: 'session-two' },
        now: new Date(2026, 6, 16, 9, 6),
      },
      () => 0,
    )

    expect(logFiles(pluginRoot)).toEqual(['session-one.log', 'session-two.log'])
  })

  it('keeps sessionIds with different unsafe filename characters separate', () => {
    const pluginRoot = createPluginRoot()

    for (const sessionId of ['session/a', 'session?a']) {
      runLoggedScript(
        {
          pluginRoot,
          scriptName: 'encoded-session',
          sessionId,
          now: new Date(2026, 6, 16, 9, 5),
        },
        () => 0,
      )
    }

    expect(logFiles(pluginRoot)).toEqual(['session%2Fa.log', 'session%3Fa.log'])
  })

  it('records console output and thrown errors without swallowing the error', () => {
    const pluginRoot = createPluginRoot()

    expect(() =>
      runLoggedScript(
        {
          pluginRoot,
          scriptName: 'failing-script',
          sessionId: 'failure-session',
          now: new Date(2026, 6, 16, 9, 5),
        },
        () => {
          console.error('diagnostic output')
          throw new Error('boom')
        },
      ),
    ).toThrow('boom')

    const entries = logEntries(pluginRoot, logFiles(pluginRoot)[0])
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'error',
          event: 'script.output',
          message: 'diagnostic output',
        }),
        expect.objectContaining({
          level: 'error',
          event: 'script.error',
          message: 'boom',
        }),
      ]),
    )
  })

  it('reads only non-array JSON objects from standard input', () => {
    const modulePath = join(repositoryRoot, 'skills/airup-codex-assets/scripts/script-logger.ts')
    const evaluate = (input: string) =>
      Bun.spawnSync({
        cmd: [process.execPath, '-e', `import { readScriptPayload } from ${JSON.stringify(modulePath)}; console.log(JSON.stringify(readScriptPayload()))`],
        cwd: repositoryRoot,
        stdin: new Blob([input]),
        stdout: 'pipe',
        stderr: 'pipe',
      })

    expect(evaluate('{"session_id":"abc"}').stdout.toString()).toBe('{"session_id":"abc"}\n')
    for (const input of ['', '   ', '[]', 'null', '"text"', '{invalid']) {
      expect(evaluate(input).stdout.toString()).toBe('null\n')
    }
  })

  it('records every console method with the exact stream and formatted message', () => {
    const pluginRoot = createPluginRoot()
    runLoggedScript({ pluginRoot, scriptName: 'console-script', sessionId: 'console-session', now: new Date(2026, 0, 2, 3, 4) }, () => {
      console.debug('debug', 1)
      console.info('info')
      console.log('log', { value: 2 })
      console.warn('warn')
      console.error('error')
      return 0
    })

    expect(
      logEntries(pluginRoot, logFiles(pluginRoot)[0])
        .filter(({ event }) => event === 'script.output')
        .map(({ level, stream, message }) => ({ level, stream, message })),
    ).toEqual([
      { level: 'debug', stream: 'stdout', message: 'debug 1' },
      { level: 'info', stream: 'stdout', message: 'info' },
      { level: 'info', stream: 'stdout', message: 'log { value: 2 }' },
      { level: 'warn', stream: 'stderr', message: 'warn' },
      { level: 'error', stream: 'stderr', message: 'error' },
    ])
  })

  it('normalizes payload context, fallback fields, and protected detail keys', () => {
    const pluginRoot = createPluginRoot()
    runLoggedScript(
      {
        pluginRoot,
        scriptName: 'context-script',
        payload: { sessionId: ' payload-session ', hookEventName: 'PostToolUse', toolName: 'shell', cwd: '/workspace' },
        details: { custom: 'kept', event: 'blocked', level: 'blocked', timestamp: 'blocked', script: 'blocked', sessionId: 'blocked', omitted: undefined },
        now: () => new Date(2026, 0, 2, 3, 4, 5),
      },
      (logger) => {
        logger.log('info', 'custom.event', { custom: 'action', event: 'blocked', omitted: undefined })
        return 4
      },
    )

    const entries = logEntries(pluginRoot, logFiles(pluginRoot)[0])
    expect(entries[0]).toEqual({
      timestamp: '2026-01-02T03:04:05.000Z',
      level: 'info',
      event: 'script.start',
      script: 'context-script',
      sessionId: 'payload-session',
      custom: 'kept',
      hookEvent: 'PostToolUse',
      toolName: 'shell',
      cwd: '/workspace',
    })
    expect(entries[1]).toEqual({
      timestamp: '2026-01-02T03:04:05.000Z',
      level: 'info',
      event: 'custom.event',
      script: 'context-script',
      sessionId: 'payload-session',
      custom: 'action',
    })
    expect(entries[2]?.exitCode).toBe(4)
  })

  it('derives the log path deterministically regardless of existing log files', () => {
    const pluginRoot = createPluginRoot()
    const logDir = join(pluginRoot, '.logs')
    // Legacy timestamped names, directories, and suffixed files must not influence the path.
    createScriptLogger({ pluginRoot, scriptName: 'setup', sessionId: 'setup', now: new Date(2026, 0, 2, 3, 4) })
    mkdirSync(join(logDir, '202601020303-reused.log'))
    writeFileSync(join(logDir, '202601020304-reused.log'), '')
    writeFileSync(join(logDir, '202601020305-reused.log'), '')
    writeFileSync(join(logDir, 'prefix202601020304-reused.log'), '')
    writeFileSync(join(logDir, '202601020304-reused.log.bak'), '')
    const logger = createScriptLogger({ pluginRoot, scriptName: 'reuse', sessionId: 'reused', now: new Date(2026, 0, 2, 3, 6) })

    expect(logger.filePath).toBe(join(logDir, 'reused.log'))
  })

  it('falls back for blank and unencodable session IDs and for non-Error throws', () => {
    const previousSessionEnv = Object.fromEntries(SESSION_ENV_NAMES.map((name) => [name, process.env[name]]))
    try {
      for (const name of SESSION_ENV_NAMES) delete process.env[name]
      const pluginRoot = createPluginRoot()
      const blank = createScriptLogger({ pluginRoot, scriptName: 'blank', sessionId: '   ', now: new Date(2026, 0, 2, 3, 4) })
      const invalid = createScriptLogger({ pluginRoot, scriptName: 'invalid', sessionId: '\ud800', now: new Date(2026, 0, 2, 3, 4) })
      const padded = createScriptLogger({ pluginRoot, scriptName: 'padded', sessionId: ' padded ', now: new Date(2026, 0, 2, 3, 4) })
      expect(blank.sessionId).toBe(`standalone-${process.pid}`)
      expect(blank.filePath).toEndWith(`standalone-${process.pid}.log`)
      expect(invalid.filePath).toEndWith(`encoded-${Buffer.from('\ud800').toString('base64url')}.log`)
      expect(padded.sessionId).toBe('padded')
      expect(padded.filePath).toEndWith('padded.log')

      expect(() =>
        runLoggedScript({ pluginRoot, scriptName: 'throw-string', sessionId: 'throw-string', now: new Date(2026, 0, 2, 3, 4) }, () => {
          throw 'failure value'
        }),
      ).toThrow('failure value')
      expect(logEntries(pluginRoot, 'throw-string.log').at(-1)).toMatchObject({
        event: 'script.error',
        message: 'failure value',
      })
    } finally {
      for (const [name, value] of Object.entries(previousSessionEnv)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    }
  })

  it('preserves explicit details when payload is absent', () => {
    const pluginRoot = createPluginRoot()
    runLoggedScript(
      { pluginRoot, scriptName: 'no-payload', sessionId: 'no-payload', payload: null, details: { custom: 'kept' }, now: new Date(2026, 0, 2, 3, 4) },
      () => 0,
    )
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])[0]).toMatchObject({ custom: 'kept' })
  })

  it('preserves explicit details for primitive payloads and zero-pads years', () => {
    const pluginRoot = createPluginRoot()
    const ancient = new Date(0)
    ancient.setFullYear(26, 0, 2)
    ancient.setHours(3, 4, 0, 0)
    runLoggedScript({ pluginRoot, scriptName: 'primitive', sessionId: 'primitive', payload: 42, details: { custom: 'kept' }, now: ancient }, () => 0)
    expect(logFiles(pluginRoot)).toEqual(['primitive.log'])
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])[0]).toMatchObject({ custom: 'kept' })
  })

  it('restores console capture after synchronous completion', () => {
    const pluginRoot = createPluginRoot()
    runLoggedScript({ pluginRoot, scriptName: 'restore-sync', sessionId: 'restore', now: new Date(2026, 0, 2, 3, 4) }, () => {
      console.log('captured')
      return 0
    })
    const before = logEntries(pluginRoot, logFiles(pluginRoot)[0])
    console.log('not captured')
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toEqual(before)
  })

  it('logs exact asynchronous lifecycle and error entries', async () => {
    const pluginRoot = createPluginRoot()
    const context = { pluginRoot, scriptName: 'async-exact', sessionId: 'async-exact', now: new Date(2026, 0, 2, 3, 4) }
    await expect(runLoggedScriptAsync(context, async () => Promise.reject(new Error('async boom')))).rejects.toThrow('async boom')
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toMatchObject([
      { level: 'info', event: 'script.start', script: 'async-exact', sessionId: 'async-exact' },
      { level: 'error', event: 'script.error', script: 'async-exact', sessionId: 'async-exact', message: 'async boom' },
    ])
  })

  it('resolves configured, environment, and package-default plugin roots in precedence order', () => {
    const previousAirupRoot = process.env.AIRUP_PLUGIN_ROOT
    const previousPluginRoot = process.env.PLUGIN_ROOT
    try {
      process.env.AIRUP_PLUGIN_ROOT = '/airup-root'
      process.env.PLUGIN_ROOT = '/plugin-root'
      expect(resolvePluginRoot('/configured-root')).toBe(resolve('/configured-root'))
      expect(resolvePluginRoot()).toBe(resolve('/airup-root'))
      delete process.env.AIRUP_PLUGIN_ROOT
      expect(resolvePluginRoot()).toBe(resolve('/plugin-root'))
      delete process.env.PLUGIN_ROOT
      expect(resolvePluginRoot()).toBe(repositoryRoot)
    } finally {
      if (previousAirupRoot === undefined) delete process.env.AIRUP_PLUGIN_ROOT
      else process.env.AIRUP_PLUGIN_ROOT = previousAirupRoot
      if (previousPluginRoot === undefined) delete process.env.PLUGIN_ROOT
      else process.env.PLUGIN_ROOT = previousPluginRoot
    }
  })

  it('logs asynchronous completion and restores console methods', async () => {
    const pluginRoot = createPluginRoot()
    const result = await runLoggedScriptAsync({ pluginRoot, scriptName: 'async-script', sessionId: 'async', now: new Date(2026, 0, 2, 3, 4) }, async () => 6)
    expect(result).toBe(6)
    const entriesBeforeUncapturedOutput = logEntries(pluginRoot, logFiles(pluginRoot)[0])
    console.log('after async logging')
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toEqual(entriesBeforeUncapturedOutput)
    expect(entriesBeforeUncapturedOutput.at(-1)).toMatchObject({ level: 'info', event: 'script.finish', exitCode: 6 })
  })

  it('does not change script behavior when the log directory cannot be created', () => {
    const pluginRootFile = join(createPluginRoot(), 'not-a-directory')
    writeFileSync(pluginRootFile, 'blocking file')

    const exitCode = runLoggedScript(
      {
        pluginRoot: pluginRootFile,
        scriptName: 'resilient-script',
        sessionId: 'resilient-session',
      },
      () => 7,
    )

    expect(exitCode).toBe(7)
  })
})

describe('operational script logging coverage', () => {
  it('uses the hook payload sessionId in a real script process', () => {
    const pluginRoot = createPluginRoot()
    const payloadPath = join(pluginRoot, 'payload.json')
    writeFileSync(
      payloadPath,
      JSON.stringify({
        cwd: repositoryRoot,
        hook_event_name: 'SessionStart',
        session_id: 'hook-session',
      }),
    )

    const result = Bun.spawnSync({
      cmd: [process.execPath, 'hooks/subagent/prevent-main-agent-write.ts'],
      cwd: repositoryRoot,
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
      stderr: 'pipe',
      stdin: Bun.file(payloadPath),
      stdout: 'pipe',
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain('Airup mode')
    expect(logFiles(pluginRoot)[0]).toBe('hook-session.log')
    expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'script.start',
          hookEvent: 'SessionStart',
          script: 'prevent-main-agent-write',
          sessionId: 'hook-session',
        }),
        expect.objectContaining({
          event: 'script.finish',
          exitCode: 0,
        }),
      ]),
    )
  })

  for (const relativePath of operationalScriptPaths) {
    it(`${relativePath} runs through the shared logger`, () => {
      const source = readFileSync(join(repositoryRoot, relativePath), 'utf-8')

      expect(source).toContain('script-logger')
      expect(source).toMatch(/runLoggedScript(?:Async)?\s*\(/)
      expect(source).not.toMatch(/process\.(?:stdout|stderr)\.write/)
    })
  }

  it('hydrates the shared logger with the managed runtime assets', () => {
    const source = readFileSync(join(repositoryRoot, 'skills/airup-codex-assets/scripts/airup-codex-assets.ts'), 'utf-8')

    expect(source).toContain("'src/shared/script-logger.ts'")
  })

  it('keeps the asset bootstrap independent from hydratable shared files', () => {
    const source = readFileSync(join(repositoryRoot, 'skills/airup-codex-assets/scripts/airup-codex-assets.ts'), 'utf-8')

    expect(source).not.toContain('from "@/shared/')
    expect(source).toContain("from './script-logger'")
  })
})
