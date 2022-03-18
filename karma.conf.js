module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    reporters: ['karma-jasmine', 'dots'],

    files: [
      'src/*.js',
      'test/*.js'
    ],

    browsers: ['FirefoxHeadless'],

    singleRun: true,

    plugins: [
      'karma-firefox-launcher',
      require.resolve('./')
    ]
  })
}
