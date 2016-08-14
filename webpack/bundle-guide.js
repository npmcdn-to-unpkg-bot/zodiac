
const path      = require('path');
const buildPath = './guide'

module.exports = require("./bundle-defaults");

Object.assign(
  module.exports,
  {
    entry: "./guide/index.coffee",

    output: {
      path: buildPath,
      filename: 'bundle.js'
    },

    devServer: {
      port: 8080,
      host: "0.0.0.0",
      inline: true,
      contentBase: buildPath,
      historyApiFallback: true
    },

    devtool: 'source-map'
  }
)
