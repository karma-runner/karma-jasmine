module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    reporters: ['karma-jasmine'],

    files: [
      'src/*.js',
      'test/*.js'
    ],

    browsers: process.env.CI ? ['FirefoxHeadless'] : ['ChromeHeadless'],

    autoWatch: true,

    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      require.resolve('./')
    ]
  })
}
