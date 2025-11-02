const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['js/app-main.ts'],
  bundle: true,
  outdir: 'dist/js',
  format: 'iife',
  target: ['es2020'],
  sourcemap: true,
  minify: true,
}).catch(() => process.exit(1));