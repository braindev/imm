/*global module, __dirname*/
"use strict";

module.exports = {
  entry: './js/app.jsx',
  output: { path: __dirname, filename: 'app.js' },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
};

