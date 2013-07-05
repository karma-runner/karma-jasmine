module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'src/*.js',
      'test/*.js'
    ],

    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],

    autoWatch: true
  });
};
