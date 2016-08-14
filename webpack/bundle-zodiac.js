
module.exports = require("./bundle-defaults");

Object.assign(
  module.exports,
  {
    entry: "./src/zodiac.js",

    output: {
      path: "./dist",
      filename: 'zodiac.bundle.min.js'
    }
  }
)
