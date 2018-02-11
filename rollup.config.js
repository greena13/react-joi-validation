import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import license from 'rollup-plugin-license';
import path from 'path';

export default {
  input: 'src/index.js',

  output: {
    format: 'cjs',
    file: process.env.NODE_ENV === 'production' ? 'cjs/react-joi-validation.production.min.js' : 'cjs/react-joi-validation.development.js',
    exports: 'named'
  },
  external: [
    'react',
    'lodash.set',
    'lodash.unset',
    'lodash.get',
    'lodash.drop',
    'lodash.has',
    'lodash.isstring',
    'lodash.isplainobject',
    'lodash.reduce',
    'lodash.defaultsdeep',
    'lodash.clonedeep',
    'lodash.foreach',
    'lodash.map',
    'invariant',
    'lodash.topath',
    'lodash.isundefined',
    'lodash.uniq',
    'lodash.keys'
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),

    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),

    (process.env.NODE_ENV === 'production' && uglify()),

    license({
      banner: {
        file: path.join(__dirname, 'LICENSE'),
      }
    })
  ]
};
