import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Compiler, Configuration } from '@rspack/core';

const appRoot = import.meta.dirname;
const distDir = resolve(appRoot, 'dist');

// Build-time metadata that cannot be bundled: absolute state directory and
// the node binary Botmux should use, plus the Botmux card-action manifest.
class BuildMetadataPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tap('BuildMetadataPlugin', () => {
      mkdirSync(resolve(distDir, 'card-actions'), { recursive: true });
      writeFileSync(resolve(distDir, 'package.json'), JSON.stringify({
        type: 'module', botmuxPluginCardConfirmation: { built: true },
      }));
      writeFileSync(resolve(distDir, 'runtime.json'), JSON.stringify({
        stateDir: resolve(appRoot, '../../.reports/botmux-card-confirmation'),
        node: process.execPath,
      }));
      writeFileSync(resolve(distDir, 'card-actions/index.json'), JSON.stringify({
        schemaVersion: 1, actions: ['card_confirmation_decide'], endpoint: '/card-action',
      }));
    });
  }
}

const config: Configuration = {
  target: 'node',
  mode: 'production',
  context: appRoot,
  entry: {
    client: './src/client.ts',
    confirm: './src/cli.ts',
    'run-local': './src/run-local.ts',
    'finish-test': './src/finish-test.ts',
    'service/index': './src/service/index.ts',
    'service/server': './src/service/server.ts',
  },
  output: {
    path: distDir,
    filename: '[name].js',
    module: true,
    chunkFormat: 'module',
    library: { type: 'module' },
    clean: true,
  },
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript' },
            target: 'es2022',
          },
        },
      },
    ],
  },
  plugins: [new BuildMetadataPlugin()],
};

export default config;
