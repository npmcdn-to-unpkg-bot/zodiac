module.exports = [
  {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    loader: 'babel'
  },
  {
    test: /\.coffee$/,
    loader: 'coffee-loader'
  },
  {
    test: /\.json\.js/,
    loader: 'tojson'
  }
];
