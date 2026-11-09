import { afterEach, describe, expect, it } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { AGENT_TOML_PATHS, computeManagedAssetHash, HASH_FILE_PATH, MANAGED_ASSET_PATHS } from '../skills/airup-codex-assets/scripts/airup-codex-assets'
import { checkStagedSkillVersions } from './pre-commit/check-staged-skill-versions'

const AGENT_EOF_MARKER = '# DF_AGENT_EOF'

const ROOT = join(import.meta.dir, '..')
const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function createRepository(): string {
  const root = mkdtempSync(join(tmpdir(), 'airup-lefthook-hash-'))
  tempRoots.push(root)
  for (const path of MANAGED_ASSET_PATHS) {
    const absolutePath = join(root, path)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, `baseline:${path}\n`)
  }
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '1.0.0' }))
  const pluginPath = join(root, '.codex-plugin', 'plugin.json')
  mkdirSync(dirname(pluginPath), { recursive: true })
  writeFileSync(pluginPath, JSON.stringify({ version: '1.0.0' }))
  for (const path of AGENT_TOML_PATHS) {
    writeFileSync(join(root, path), '# airup-version = "1.0.0"\nname = "test-agent"\n')
  }
  const hashPath = join(root, HASH_FILE_PATH)
  mkdirSync(dirname(hashPath), { recursive: true })
  writeFileSync(hashPath, 'baseline-hash\n')
  git(root, 'init')
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Airup Test')
  git(root, 'add', '.')
  git(root, 'commit', '--no-verify', '-m', 'test: baseline')
  return root
}

function git(root: string, ...args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ['git', ...args],
    cwd: root,
    stderr: 'pipe',
    stdout: 'pipe',
  })
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString())
  }
  return result.stdout.toString().trim()
}

function writeSkill(root: string, skill: string, version: string, body = 'baseline'): string {
  const path = join(root, 'skills', skill, 'SKILL.md')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, ['---', `name: ${skill}`, `version: "${version}"`, 'metadata:', `  version: "${version}"`, '---', '', body, ''].join('\n'))
  return path
}

describe('Lefthook managed asset hash', () => {
  it('requires a changed staged skill to increment both version fields once', () => {
    const root = createRepository()
    writeSkill(root, 'airup-example', '1.2.3')
    git(root, 'add', 'skills/airup-example/SKILL.md')
    git(root, 'commit', '--no-verify', '-m', 'test: add skill')

    writeSkill(root, 'airup-example', '1.2.3', 'changed')
    git(root, 'add', 'skills/airup-example/SKILL.md')

    expect(checkStagedSkillVersions(root)).toEqual(['skills/airup-example/SKILL.md'])
    expect(git(root, 'show', ':skills/airup-example/SKILL.md')).toContain('version: "1.2.4"')
  })

  it('increments a renamed staged skill from the version at its old path', () => {
    const root = createRepository()
    writeSkill(root, 'airup-example', '1.2.3')
    git(root, 'add', 'skills/airup-example/SKILL.md')
    git(root, 'commit', '--no-verify', '-m', 'test: add skill')

    git(root, 'mv', 'skills/airup-example', 'skills/airup-renamed')
    writeSkill(root, 'airup-renamed', '1.2.3', 'changed')
    git(root, 'add', 'skills/airup-renamed/SKILL.md')

    expect(checkStagedSkillVersions(root)).toEqual(['skills/airup-renamed/SKILL.md'])
    expect(git(root, 'show', ':skills/airup-renamed/SKILL.md')).toContain('version: "1.2.4"')
  })

  it('accepts a changed staged skill when both version fields increment once', () => {
    const root = createRepository()
    writeSkill(root, 'airup-example', '1.2.3')
    git(root, 'add', 'skills/airup-example/SKILL.md')
    git(root, 'commit', '--no-verify', '-m', 'test: add skill')

    writeSkill(root, 'airup-example', '1.2.4', 'changed')
    git(root, 'add', 'skills/airup-example/SKILL.md')

    expect(checkStagedSkillVersions(root)).toEqual(['skills/airup-example/SKILL.md'])
  })

  it('ignores unstaged skill changes', () => {
    const root = createRepository()
    writeSkill(root, 'airup-example', '1.2.3')
    git(root, 'add', 'skills/airup-example/SKILL.md')
    git(root, 'commit', '--no-verify', '-m', 'test: add skill')

    writeSkill(root, 'airup-example', '1.2.3', 'unstaged change')

    expect(checkStagedSkillVersions(root)).toEqual([])
  })

  it('manages every distributable subagent TOML', () => {
    expect(AGENT_TOML_PATHS).toEqual([
      'agents/airup-dev-backend-engineer.toml',
      'agents/airup-dev-backend-test-engineer.toml',
      'agents/airup-dev-database-steward.toml',
      'agents/airup-doc-documentation-writer.toml',
      'agents/airup-dev-frontend-engineer.toml',
      'agents/airup-dev-frontend-test-engineer.toml',
      'agents/airup-ops-artifact-manager.toml',
      'agents/airup-ops-vcs-manager.toml',
    ])
  })

  it('requires every distributable subagent TOML to end with its EOF marker', () => {
    for (const path of AGENT_TOML_PATHS) {
      expect(readFileSync(join(ROOT, path), 'utf-8').trimEnd()).toEndWith(AGENT_EOF_MARKER)
    }
  })

  it('syncs and stages a hash for the exact Git index contents', () => {
    const root = createRepository()
    const managedPath = MANAGED_ASSET_PATHS[0]
    const absolutePath = join(root, managedPath)
    writeFileSync(absolutePath, 'staged version\n')
    git(root, 'add', managedPath)
    const expectedHash = computeManagedAssetHash(root)
    writeFileSync(absolutePath, 'unstaged version\n')

    const result = Bun.spawnSync({
      cmd: [process.execPath, join(ROOT, 'skills', 'airup-codex-assets', 'scripts', 'airup-codex-assets.ts'), 'sync-staged'],
      cwd: root,
      env: { ...process.env, PLUGIN_ROOT: root },
      stderr: 'pipe',
      stdout: 'pipe',
    })

    expect(result.exitCode, result.stderr.toString()).toBe(0)
    expect(result.stdout.toString()).toContain(expectedHash)
    expect(readFileSync(absolutePath, 'utf-8')).toBe('unstaged version\n')
    expect(git(root, 'show', `:${managedPath}`)).toBe('staged version')
    expect(git(root, 'show', `:${HASH_FILE_PATH}`)).toBe(expectedHash)
    expect(git(root, 'diff', '--cached', '--name-only')).toContain(HASH_FILE_PATH)
  })

  it('configures Lefthook quality and managed asset gates before commit', () => {
    const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
    const lefthookConfig = readFileSync(join(ROOT, 'lefthook.yml'), 'utf-8')
    const entryScript = readFileSync(join(ROOT, 'scripts', 'pre-commit', 'pre-commit.ts'), 'utf-8')

    expect(packageJson.scripts?.prepare).toBe('lefthook install')
    expect(packageJson.devDependencies?.lefthook).toBeDefined()
    expect(packageJson.devDependencies?.husky).toBeUndefined()
    expect(existsSync(join(ROOT, '.husky'))).toBe(false)
    expect(lefthookConfig).toContain('run: bun scripts/pre-commit/pre-commit.ts')
    for (const step of [
      'ensureSkillEofMarkers',
      'checkStagedMarkdown',
      "biome(['format', '.'])",
      "biome(['check', '.'])",
      'checkStagedSkillVersions',
      'syncStagedVersionAlignment',
      "runCli(['sync-staged'])",
    ]) {
      expect(entryScript).toContain(step)
    }
  })
})
