#!/usr/bin/env bun

import { resolve } from 'node:path'
import { runLoggedScriptAsync } from '@/shared/script-logger'
import { runCli } from '../../skills/airup-codex-assets/scripts/airup-codex-assets'
import { checkStagedSkillVersions } from './check-staged-skill-versions'
import { ensureSkillEofMarkers } from './ensure-skill-eof'
import { checkStagedMarkdown } from './format-markdown-codeblocks'
import { syncStagedVersionAlignment } from './sync-staged-versions'

const REPOSITORY_ROOT = resolve(import.meta.dir, '../..')

function biome(args: string[]): number {
  const result = Bun.spawnSync({
    cmd: [process.execPath, 'x', '@biomejs/biome', ...args],
    cwd: REPOSITORY_ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  return result.exitCode
}

async function runPreCommit(): Promise<number> {
  const eof = await ensureSkillEofMarkers(REPOSITORY_ROOT)
  console.log(`SKILL.md files: ${eof.found}; updated: ${eof.updated}`)

  const markdown = checkStagedMarkdown()
  if (markdown !== 0) return markdown

  const format = biome(['format', '.'])
  if (format !== 0) return format

  const lint = biome(['check', '.'])
  if (lint !== 0) return lint

  const checked = checkStagedSkillVersions(REPOSITORY_ROOT)
  console.log(`Staged skill versions checked: ${checked.length}`)

  const versions = await syncStagedVersionAlignment(REPOSITORY_ROOT)
  console.log(`Staged release versions synchronized: ${versions.version}`)

  return runCli(['sync-staged'])
}

// Stryker disable next-line ConditionalExpression -- import.meta.main is an untestable runtime loader boundary
if (import.meta.main) {
  process.exit(await runLoggedScriptAsync({ scriptName: 'pre-commit' }, runPreCommit))
}
