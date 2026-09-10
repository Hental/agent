#!/usr/bin/env node
import { run } from './report.mjs';
run(['pdf', ...process.argv.slice(2)]).catch(error => {
  console.error(`导出失败：${error.message}`);
  process.exitCode = 1;
});
