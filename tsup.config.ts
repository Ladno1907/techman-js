import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'], 
  bundle: false, 
  format: ['cjs', 'esm'],
  dts: false,//true,
  clean: true,
  esbuildOptions(options) {
    options.outbase = './src';
  },

  sourcemap: true,
  minify: false,
});
