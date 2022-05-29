module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    reporters: ['karma-jasmine'],

    files: ['test/*.js'],

    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],

    autoWatch: true,

    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      require.resolve('../../../')
    ]
  })
}
