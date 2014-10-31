var path = require('path');

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      path.dirname(require.resolve('jasmine-core')) + '/jasmine-core/jasmine.js',
      'src/*.js',
      'test/*.js'
    ],

    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],

    autoWatch: true
  });
};
