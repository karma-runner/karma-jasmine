module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'lib/jasmine.js',
      'src/*.js',
      'test/*.js'
    ],

    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],

    autoWatch: true
  });
};
