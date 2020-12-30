import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'
import common from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: 'src/index.js',
  plugins: [
    babel(),
    common(),
    resolve(),
    terser({output: {comments: false}})
  ],
  external: ['pixi.js'],
  output: [
    {
      file: 'dist/interaction.min.js',
      format: 'umd',
      name: 'Interaction',
      sourcemap: true,
      globals: {
        'pixi.js': 'PIXI'
      }
    },
    {
      file: 'dist/interaction.es.js',
      format: 'esm',
      name: 'Interaction',
      sourcemap: true,
      globals: {
        'pixi.js': 'PIXI'
      }
    }
  ]
}
