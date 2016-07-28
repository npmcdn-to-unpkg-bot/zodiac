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
    test: /\.scss$/,
    loaders: ["style", "css", "sass"]
  },
  {
    test: /\.css$/,
    loaders: ["style", "css"]
  },
  {
    test: /\.json\.js/,
    loader: 'tojson'
  }
];
