import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = join(import.meta.dir!, '..')
const EXCLUDED_DIRECTORIES = new Set(['.git', '.stryker-tmp', 'coverage', 'node_modules', 'reports'])
const TEXT_EXTENSIONS = new Set(['', '.json', '.md', '.toml', '.ts', '.yml', '.yaml', '.svg'])

// Every legacy token is assembled from parts so this guard never matches its own source.
const legacySlug = ['dev', 'opsflow'].join('')
const legacyBrand = ['Dev', 'opsFlow'].join('')
const legacyUpper = ['DEV', 'OPSFLOW'].join('')
const legacyDotDirectory = ['.', 'dev', 'opsflow'].join('')
const legacyBrandCase = ['Dev', 'OpsFlow'].join('')
const olderLegacySlug = ['dev', 'flow-skills'].join('')
const olderLegacyBrand = ['Dev', 'Flow'].join('')
const olderLegacyUpper = ['DEV', 'FLOW'].join('')
const olderLegacyDotDirectory = ['.', 'dev', 'flow'].join('')
const currentSlug = 'airup'
const currentBrand = 'Airup'
const currentPluginId = ['airup', '@', 'airup'].join('')
const repository = `LiTeXz/${currentSlug}`
const repositoryUrl = `https://github.com/${repository}`
const migrationDocument = 'README.md'
const legacyTokens = [
  legacySlug,
  legacyBrand,
  legacyUpper,
  legacyDotDirectory,
  legacyBrandCase,
  olderLegacySlug,
  olderLegacyBrand,
  olderLegacyUpper,
  olderLegacyDotDirectory,
]

function collectTextFiles(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory)) {
    if (EXCLUDED_DIRECTORIES.has(entry)) continue
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      files.push(...collectTextFiles(path))
    } else if (TEXT_EXTENSIONS.has(extname(entry))) {
      files.push(path)
    }
  }
  return files
}

// A legacy token inside a negative expectation proves the old branding is absent instead of
// reintroducing it, so only the expectation argument is masked out.
const NEGATIVE_ASSERTION_ARGUMENT = /\bnot\.(?:toContain|toMatch|toEqual|toBe)\s*\(\s*(['"`])(.*?)\1|\bnot\.(?:toMatch|toEqual|toBe)\s*\(\s*(\/.*?\/[a-z]*)/g

function maskNegativeAssertionArguments(line: string): string {
  return line.replace(NEGATIVE_ASSERTION_ARGUMENT, (match, _quote, quoted, regex) => {
    const masked = ' '.repeat((quoted ?? regex ?? match).length)
    return match.replace(quoted ?? regex ?? '', masked)
  })
}

describe(`${currentBrand} project identity`, () => {
  it('contains no legacy internal branding or filenames', () => {
    for (const file of collectTextFiles(ROOT)) {
      const projectPath = relative(ROOT, file).replaceAll('\\', '/')
      for (const token of legacyTokens) {
        expect(projectPath, projectPath).not.toContain(token)
      }

      const lines = readFileSync(file, 'utf-8').split('\n')
      for (const [index, line] of lines.entries()) {
        const masked = maskNegativeAssertionArguments(line)
        for (const token of legacyTokens) {
          expect(masked, `${projectPath}:${index + 1}`).not.toContain(token)
        }
      }
    }
  })

  it('uses the new package and plugin identity', () => {
    const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    const pluginJson = JSON.parse(readFileSync(join(ROOT, '.codex-plugin', 'plugin.json'), 'utf-8'))

    expect(packageJson.name).toBe(currentSlug)
    expect(pluginJson.name).toBe(currentSlug)
    expect(pluginJson.interface.displayName).toBe(currentBrand)
    expect(pluginJson.homepage).toBe(repositoryUrl)
    expect(pluginJson.repository).toBe(repositoryUrl)
    expect(pluginJson.interface.websiteURL).toBe(repositoryUrl)
    const pluginDescription = [pluginJson.description, pluginJson.interface.longDescription].join(' ')
    for (const capability of ['skills', 'hooks', 'MCP', 'agent harness']) {
      expect(pluginDescription).toContain(capability)
    }
  })

  it('keeps the Cursor plugin and every marketplace manifest on the new identity', () => {
    const cursorPlugin = JSON.parse(readFileSync(join(ROOT, '.cursor-plugin', 'plugin.json'), 'utf-8'))
    expect(cursorPlugin.name).toBe(currentSlug)
    expect(cursorPlugin.displayName).toBe(currentBrand)
    expect(cursorPlugin.homepage).toBe(repositoryUrl)
    expect(cursorPlugin.repository).toBe(repositoryUrl)

    for (const manifestPath of ['.agents/plugins/marketplace.json', '.codex-plugin/marketplace.json']) {
      const marketplace = JSON.parse(readFileSync(join(ROOT, manifestPath), 'utf-8'))
      expect(marketplace.name, manifestPath).toBe(currentSlug)
      expect(marketplace.interface.displayName, manifestPath).toBe(currentBrand)
      expect(marketplace.plugins[0].name, manifestPath).toBe(currentSlug)
      expect(marketplace.plugins[0].source, manifestPath).toEqual({ source: 'local', path: '.' })
    }

    const cursorMarketplace = JSON.parse(readFileSync(join(ROOT, '.cursor-plugin', 'marketplace.json'), 'utf-8'))
    expect(cursorMarketplace.name).toBe(currentSlug)
    expect(cursorMarketplace.plugins[0].name).toBe(currentSlug)
  })

  it('keeps README user-facing and documents plugin update commands', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    const contributing = readFileSync(join(ROOT, 'CONTRIBUTING.md'), 'utf-8')

    expect(readme).toContain(`codex plugin marketplace upgrade ${currentSlug}`)
    expect(readme).toContain(`codex plugin add ${currentPluginId}`)
    for (const developmentDetail of ['bun run', 'pnpm ', 'Husky', 'format:markdown', 'pre-commit']) {
      expect(readme).not.toContain(developmentDetail)
    }
    expect(contributing).toContain('bun run format:markdown:write')
    expect(contributing).toContain('Husky `pre-commit`')
  })

  it('documents project scope, naming rationale, and migration rules', () => {
    const readme = readFileSync(join(ROOT, migrationDocument), 'utf-8')

    for (const namingToken of [`\`${currentSlug}\``, `\`${currentBrand}\``, `\`${currentPluginId}\``]) {
      expect(readme).toContain(namingToken)
    }
    for (const capability of ['skills', 'hooks', 'MCP', 'agent', 'agent harness']) {
      expect(readme).toContain(capability)
    }
    for (const testLayer of ['单元测试', '功能性测试', '集成测试', '属性测试', '灰度测试', '线上问题排查测试']) {
      expect(readme).toContain(testLayer)
    }
    expect(readme).toContain(`codex plugin marketplace add ${repository}`)
    expect(readme).toContain('历史 Git 提交、标签和发布记录保持不变')
  })
})
