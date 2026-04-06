import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/qr.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2022',
});
