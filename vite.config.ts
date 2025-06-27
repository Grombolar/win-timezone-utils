import { defineConfig } from 'vite'
import path from 'path';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  plugins: [yaml()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'time-zones',
      fileName: (format) => `time-zones.${format}.js`,
      formats: ['es', 'cjs']
    },
  }
})
