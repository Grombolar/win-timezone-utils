import { defineConfig } from 'vite'
import path from 'path';
import yaml from '@rollup/plugin-yaml';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    yaml(),
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'win-timezone-utils',
      fileName: (format) => `win-timezone-utils.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: []
    }
  }
})
