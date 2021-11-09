import esbuild from 'esbuild';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';

esbuild
  .build({
    plugins: [globalExternals({ phaser: 'Phaser' })],
    entryPoints: ['app.js'],
    outfile: 'bundle.js',
    bundle: true,
    target: 'es6',
    format: 'iife',
    platform: 'browser',
    minifySyntax: true,
    minifyWhitespace: true,
    minifyIdentifiers: false,
    banner: {
      js: '// Repository: https://github.com/natureofcode/svg-to-phaser-path',
    },
  })
  .catch(() => process.exit(1));
