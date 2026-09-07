#!/usr/bin/env node
import { parseCliArgs } from './args.js';
import { runCommand } from './run.js';

try {
  const result = await runCommand(parseCliArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
