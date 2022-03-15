module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    reporters: ['karma-jasmine'],

    files: [
      'src/*.js',
      'test/*.js'
    ],

    browsers: ['FirefoxHeadless'],

    autoWatch: true,

    plugins: [
      'karma-firefox-launcher',
      require.resolve('./')
    ]
  })
}
