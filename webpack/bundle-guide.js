
var HtmlWebpackPlugin = require('html-webpack-plugin');

const webpack = require('webpack');

module.exports = require("./bundle-defaults");

Object.assign(
  module.exports,
  {
    entry: {
      app: ["./guide/index.coffee"]
    },

    output: {
      path: "dist-guide",
      filename: '[name].js'
    },

    devServer: {
      port: 8080,
      host: "0.0.0.0",
      inline: true,
      historyApiFallback: true
    },

    plugins: [
      new HtmlWebpackPlugin({
        hash: true,
        template: "guide/index.html",
        chunks: ["app"]
      })
    ],

    devtool: 'inline-source-map'
  }
)
