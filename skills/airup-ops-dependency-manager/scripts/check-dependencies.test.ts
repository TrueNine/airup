import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scanGitHub } from './check-github-dependencies'
import { scanGradle } from './check-gradle-dependencies'
import { detectPackageManager, scanJavaScript } from './check-js-dependencies'
import { scanMaven } from './check-maven-dependencies'
import { dependencyFinding, parseOptions, toToon } from './common'

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'ops-dependency-manager-'))
  try {
    run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('JavaScript dependency checker', () => {
  it('detects package managers and direct candidates', () =>
    fixture((root) => {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { used: '1', unused: '1' } }))
      writeFileSync(join(root, 'package-lock.json'), '{}')
      writeFileSync(join(root, 'index.ts'), "import 'used';")
      expect(detectPackageManager(root)).toBe('npm')
      expect(scanJavaScript(root).map((finding) => finding.dependency)).toEqual(['unused'])
    }))
  it('does not treat peer and optional declarations as automatic fixes', () =>
    fixture((root) => {
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({
          peerDependencies: { peer: '1' },
          optionalDependencies: { optional: '1' },
        }),
      )
      writeFileSync(join(root, 'index.ts'), 'export {}; ')
      expect(scanJavaScript(root)).toEqual([])
    }))
})

describe('Gradle and Maven dependency checkers', () => {
  it('recognizes Gradle declarations but keeps them review-only', () =>
    fixture((root) => {
      writeFileSync(join(root, 'gradlew.bat'), '')
      writeFileSync(join(root, 'build.gradle'), 'dependencies { implementation("example:lib:1") }')
      expect(scanGradle(root)[0]?.autoFixable).toBe(false)
    }))
  it('reports Maven duplicate review evidence', () =>
    fixture((root) => {
      writeFileSync(join(root, 'pom.xml'), '<project><groupId>a</groupId><artifactId>x</artifactId><groupId>b</groupId><artifactId>x</artifactId></project>')
      expect(scanMaven(root)[0]?.type).toBe('duplicate-review')
    }))
})

describe('GitHub dependency policy checker', () => {
  it('reports missing Dependabot policy', () =>
    fixture((root) => {
      expect(scanGitHub(root)[0]?.type).toBe('missing-policy')
    }))
  it('reports missing weekly policy fields', () =>
    fixture((root) => {
      mkdirSync(join(root, '.github'), { recursive: true })
      writeFileSync(join(root, '.github', 'dependabot.yml'), 'version: 2\nupdates: []\n')
      const types = scanGitHub(root).map((finding) => finding.type)
      expect(types).toEqual(['policy', 'policy', 'policy'])
    }))
})

describe('TOON emission', () => {
  const sample = [
    dependencyFinding({
      ecosystem: 'javascript',
      file: 'package.json',
      dependency: 'left-pad',
      type: 'unused-direct',
      evidence: 'name absent from imports, confirm with Knip',
      action: 'remove after Knip confirmation',
      autoFixable: true,
    }),
  ]

  it('emits the exact header plus one row per finding with required quoting', () => {
    expect(toToon(sample)).toBe(
      [
        'findings[1]{ecosystem,file,dependency,type,evidence,risk,action,autoFixable}:',
        '  javascript,package.json,left-pad,unused-direct,"name absent from imports, confirm with Knip",blocking,remove after Knip confirmation,true',
      ].join('\n'),
    )
  })
  it('quotes cells that would otherwise parse as numbers, booleans, null or bracketed lists', () => {
    const finding = dependencyFinding({
      ecosystem: 'maven',
      file: 'pom.xml',
      dependency: '42',
      type: 'null',
      evidence: 'see [dependency:tree]',
      action: 'true',
      autoFixable: false,
    })
    expect(toToon([finding]).split('\n')[1]).toBe('  maven,pom.xml,"42","null","see [dependency:tree]",blocking,"true",false')
  })
  it('emits an empty header and parses the toon format flag with text as default', () => {
    expect(toToon([])).toBe('findings[0]:')
    expect(parseOptions(['--format', 'toon']).format).toBe('toon')
    expect(parseOptions(['--format', 'json']).format).toBe('json')
    expect(parseOptions(['--format', 'text']).format).toBe('text')
    expect(parseOptions([]).format).toBe('text')
  })
})
