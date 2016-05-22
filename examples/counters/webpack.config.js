
const path    = require('path');
const webpack = require('webpack');

const buildPath = './dev-server'

module.exports = {
  entry: ['./index.js'],
  output: {
    path: path.resolve(__dirname, buildPath),
    filename: 'bundle.js'
  },
  devServer: {
    port: 8080,
    host: "0.0.0.0",
    inline: true,
    contentBase: buildPath,
    historyApiFallback: true
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
