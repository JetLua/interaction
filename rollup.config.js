import babel from 'rollup-plugin-babel'
import common from 'rollup-plugin-commonjs'
import minify from 'rollup-plugin-babel-minify'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.js',
  plugins: [
    babel(),
    common(),
    resolve(),
    minify({comments: false})
  ],
  output: [
    {
      file: 'dist/interaction.min.js',
      format: 'umd',
      name: 'interaction',
      sourcemap: true
    },
    {
      file: 'dist/interaction.es.js',
      format: 'esm',
      name: 'interaction',
      sourcemap: true
    }
  ]
}