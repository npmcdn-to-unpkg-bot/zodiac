
const path      = require('path');
const buildPath = './dist'

module.exports = require("./defaults");
Object.assign(
  module.exports,
  {
    entry: "./src/zodiac.js",

    output: {
      path: path.resolve(__dirname, buildPath),
      filename: 'zodiac.bundle.min.js'
    }
  }
)
