import babel from 'rollup-plugin-babel'
import common from 'rollup-plugin-commonjs'
import {terser} from 'rollup-plugin-terser'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.js',
  plugins: [
    babel(),
    common(),
    resolve(),
    terser({output: {comments: false}})
  ],
  output: [
    {
      file: 'dist/interaction.min.js',
      format: 'umd',
      name: 'Interaction',
      sourcemap: true
    },
    {
      file: 'dist/interaction.es.js',
      format: 'esm',
      name: 'Interaction',
      sourcemap: true
    }
  ]
}