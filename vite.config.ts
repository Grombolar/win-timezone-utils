import { defineConfig } from 'vite'
import path from 'path'
import yaml from '@rollup/plugin-yaml'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    yaml(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      entryRoot: 'src'
    })
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'WinTimezoneUtils',
      formats: ['es', 'cjs'],            // 明确声明两种格式
      fileName: (format) =>
        format === 'es'
          ? 'index.es.js'
          : 'index.cjs'                  // 不带 .js 更符合 Node 习惯
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' }
      }
    }
  }
})