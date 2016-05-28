
const path      = require('path');
const buildPath = './dev-server'

module.exports = require("./defaults");
Object.assign(
  module.exports,
  {
    entry: "./dev-server/index.coffee",

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

    devtool: 'source-map'
  }
)
