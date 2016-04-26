
var path    = require('path');
var webpack = require('webpack');

module.exports = {
    entry: ['./demo.js'],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'demo.bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};
