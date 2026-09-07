#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

// Keep package-directory overrides compatible with Node's package resolution.
const resolveModule = createRequire(import.meta.url).resolve;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const usage = `Usage:
  node apps/wx-call/lib/control.mjs <name>          # Screenshot only
  node apps/wx-call/lib/control.mjs <name> <x> <y>  # Click, then screenshot

Each run saves screenshots and Midscene logs under .reports/midscene-desktop/.
Coordinates use desktop logical pixels, not necessarily screenshot image pixels.
Optional: MIDSCENE_COMPUTER_MODULE specifies an existing package directory.
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
    console.log(usage);
    return;
  }
  const [name, ...coords] = args;
  if (!/^[a-z0-9-]+$/.test(name) || ![0, 2].includes(coords.length)) {
    throw new Error(`Invalid arguments.\n${usage}`);
  }
  const point = coords.map(Number);
  if (!point.every(n => Number.isFinite(n) && n >= 0)) {
    throw new Error('Coordinates must be non-negative finite numbers.');
  }

  // Resolve before changing cwd so relative overrides use the caller's directory.
  const moduleName = process.env.MIDSCENE_COMPUTER_MODULE
    ? path.resolve(process.env.MIDSCENE_COMPUTER_MODULE)
    : '@midscene/computer';
  let modulePath;
  try {
    modulePath = resolveModule(moduleName);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    throw new Error('Install dependencies first: SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --prefix apps/wx-call');
  }

  const reports = path.resolve(scriptDir, '../../../.reports/midscene-desktop');
  fs.mkdirSync(reports, {recursive: true});
  const runDir = fs.mkdtempSync(path.join(reports, `${name}-`));
  const previousCwd = process.cwd();
  process.chdir(runDir);
  try {
    const computerModule = await import(pathToFileURL(modulePath).href);
    const {ComputerDevice} = computerModule.default ?? computerModule;
    const device = new ComputerDevice({});
    try {
      await device.connect(); // Includes screenshot and mouse health checks.
      const size = await device.size();
      console.log('Display size (logical pixels):', size);
      if (point.length) {
        const [x, y] = point;
        if (x >= size.width || y >= size.height) throw new Error('Coordinates are outside the primary display.');
        await device.inputPrimitives.pointer.tap({x, y});
        await new Promise(resolve => setTimeout(resolve, 900));
      }
      const shot = await device.screenshotBase64();
      const output = path.join(runDir, `${name}.png`);
      fs.writeFileSync(output, Buffer.from(shot.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
      console.log('Screenshot:', output);
    } finally {
      await device.destroy();
    }
  } finally {
    process.chdir(previousCwd);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
