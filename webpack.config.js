
var path    = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ['./demo.js'],
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'demo.bundle.js'
  },
  devServer: {
    port: 8080,
    host: "0.0.0.0",
    inline: true
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
      }
    ]
  },
  stats: {
    colors: true
  },
  devtool: 'source-map'
};
