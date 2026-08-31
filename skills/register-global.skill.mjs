#!/usr/bin/env zx

import { chalk } from 'zx';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(scriptDir, 'global');
const registryRoot = path.join(os.homedir(), '.agents', 'skills');
const dryRun = process.argv.includes('--dry-run');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: pnpm run skills:register-global [-- --dry-run]

Register every valid skill in skills/global as a symbolic link under
~/.agents/skills. Existing real paths and links to other sources are never
overwritten.`);
  process.exit(0);
}

async function lstatOrUndefined(target) {
  try {
    return await fs.lstat(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function resolveLink(linkPath, linkTarget) {
  return path.resolve(path.dirname(linkPath), linkTarget);
}

async function discoverSkills() {
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  const skills = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    if (!/^[a-z0-9-]+$/.test(entry.name)) {
      throw new Error(`Invalid skill directory name: ${entry.name}`);
    }

    const source = path.join(sourceRoot, entry.name);
    const manifest = path.join(source, 'SKILL.md');
    const manifestStat = await lstatOrUndefined(manifest);
    if (!manifestStat?.isFile()) {
      throw new Error(`Missing SKILL.md: ${source}`);
    }
    skills.push({ name: entry.name, source });
  }

  return skills;
}

async function registerSkill(skill) {
  const destination = path.join(registryRoot, skill.name);
  const destinationStat = await lstatOrUndefined(destination);

  if (!destinationStat) {
    if (!dryRun) await fs.symlink(skill.source, destination, 'dir');
    return { status: 'created', destination };
  }

  if (!destinationStat.isSymbolicLink()) {
    return {
      status: 'conflict',
      destination,
      reason: 'destination is a real file or directory',
    };
  }

  const currentTarget = await fs.readlink(destination);
  const resolvedTarget = resolveLink(destination, currentTarget);
  if (resolvedTarget === skill.source) {
    return { status: 'unchanged', destination };
  }

  return {
    status: 'conflict',
    destination,
    reason: `link points to ${resolvedTarget}`,
  };
}

await fs.mkdir(registryRoot, { recursive: true });
const skills = await discoverSkills();

if (!skills.length) {
  console.log(chalk.yellow(`No skills found in ${sourceRoot}`));
  process.exit(0);
}

const results = [];
for (const skill of skills) {
  results.push({ skill, ...(await registerSkill(skill)) });
}

for (const result of results) {
  if (result.status === 'created') {
    console.log(chalk.green(`${dryRun ? 'would create' : 'created'}  ${result.skill.name} -> ${result.skill.source}`));
  } else if (result.status === 'unchanged') {
    console.log(chalk.gray(`unchanged ${result.skill.name}`));
  } else {
    console.error(chalk.red(`conflict  ${result.skill.name}: ${result.reason}`));
  }
}

const created = results.filter((result) => result.status === 'created').length;
const unchanged = results.filter((result) => result.status === 'unchanged').length;
const conflicts = results.filter((result) => result.status === 'conflict');

console.log(`\n${dryRun ? 'Dry run' : 'Registered'}: ${created}, unchanged: ${unchanged}, conflicts: ${conflicts.length}`);
console.log(`Registry: ${registryRoot}`);

if (conflicts.length) process.exitCode = 1;
