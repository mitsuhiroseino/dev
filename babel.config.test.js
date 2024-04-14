// const config = require('./babel.config');

// // node_modules配下のesmをcjsに変換するために追加
// config.plugins.push('@babel/plugin-transform-modules-commonjs');

// module.exports = config;

module.exports = {
  extends: './babel.config.js',
  plugins: ['@babel/plugin-transform-modules-commonjs'],
};
