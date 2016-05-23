
module.exports = function(config) {
  config.set({

    basePath:    '.',
    port:        9876,
    colors:      true,
    autoWatch:   true,
    singleRun:   false,
    concurrency: Infinity,
    logLevel:    config.LOG_INFO,
    // possible values:
    // config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN ||
    // config.LOG_INFO || config.LOG_DEBUG

    frameworks: ['jasmine'],
    reporters:  ['spec'],
    browsers:   ['PhantomJS'],

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'test/**/*.coffee'
    ],

    exclude: [],

    preprocessors: {
      'test/**/*.coffee': ['webpack', 'sourcemap'],
      'src/**/*.js': ['webpack', 'sourcemap']
    },

    webpack: require("./webpack/karma.js")
  });
}
