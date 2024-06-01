import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import del from 'rollup-plugin-delete'

const base = defineConfig({
  input: './src/index.ts',
  plugins: [
    resolve(),
    commonjs({
      exclude: 'node_modules/**',
    }),
    json(),
  ],
})

export default defineConfig([
  {
    ...base,
    output: {
      format: 'cjs',
      dir: 'dist/cjs',
    },
    plugins: [
      ...base.plugins,
      del({ targets: './dist/cjs/*' }),
      typescript({
        tsconfig: 'tsconfig.cjs.json',
      }),
    ],
  },
  {
    ...base,
    output: {
      format: 'esm',
      dir: 'dist/esm',
    },
    plugins: [
      del({ targets: './dist/esm/*' }),
      ...base.plugins,
      typescript({
        tsconfig: 'tsconfig.esm.json',
      }),
    ],
  },
])
